import { projectEnemyBirthBuffOption } from '../src/domains/enemy/birthBuffOptions.ts';
import { mkdir, readFile, writeFile, readdir, unlink } from 'node:fs/promises';
import { resolve, join, dirname, basename } from 'node:path';
import { pathToFileURL } from 'node:url';
import { formatGeneratedSource } from '../src/compiler/publication/formatGeneratedSource.ts';
import { createHash } from 'node:crypto';
import { enemyStageNameTextIds } from '../config/enemyStageNames.ts';
import {
  collectSpawnerEnemies,
  findSpawnerBuffs,
  findSpawnerCount,
  loadSceneEnemies,
  loadSceneSpawners,
} from '../src/domains/enemy/spawnerAttributes.ts';

interface TextReference {
  id?: string;
  text?: string;
}
interface StageSource {
  dungeonCategory: string;
  dungeonSeriesId: string;
  dungeonName: TextReference;
  dungeonLevelDesc?: TextReference;
  enemyIds: string[];
  enemyLevels: number[];
  sortId: number;
  sceneId?: string;
}
interface EnemySource {
  templateId: string;
  attrTemplateId: string;
  attrModifiers: unknown[];
  bornBuffs: string[];
}
/** 关卡展示目录保留具体敌人身份；不把未实现的变体降级成普通敌人。 */
export async function generateEnemyStageCatalog(args: {
  tablesDirectory: string;
  outputDirectory: string;
  localeDirectory: string;
  spawnerDirectory?: string;
  levelDirectory?: string;
  buffDirectory?: string;
  check: boolean;
}) {
  const directory = args.tablesDirectory;
  const messages: Record<string, Record<string, string>> = { 'zh-CN': {}, en: {} };
  async function table<T>(name: string): Promise<Record<string, T>> {
    // 文本 ID 为 int64，必须在 JSON 解析前保留其十进制表示。
    const text = await readFile(join(directory, `${name}.json`), 'utf8');
    return JSON.parse(text.replace(/("id"\s*:\s*)(-?\d{16,})/g, '$1"$2"'));
  }
  const [dungeons, series, enemies, displays, cn, en] = await Promise.all([
    table<StageSource>('DungeonTable'),
    table<{ name: TextReference; sortId: number }>('DungeonSeriesTable'),
    table<EnemySource>('EnemyTable'),
    table<{ name: TextReference }>('EnemyDisplayInfoTable'),
    table<string>('I18nTextTable_CN'),
    table<string>('I18nTextTable_EN'),
  ]);
  const towerGroups = await table<{ stars: Record<string, { gameId: string }> }>(
    'SeasonTowerGameGroupTable',
  );
  const towerGroupByStage = new Map(
    Object.entries(towerGroups).flatMap(([groupId, group]) =>
      Object.values(group.stars).map(star => [star.gameId, groupId] as const),
    ),
  );
  const towerDifficulty = new Map(
    Object.values(towerGroups).flatMap(group =>
      Object.entries(group.stars).map(([rank, star]) => [star.gameId, Number(rank)] as const),
    ),
  );
  const [monuments, bossGroups, bossGames] = await Promise.all([
    table<{ hdId: string }>('HighDifficultySeriesTable'),
    table<{ hdId: string; bossName: TextReference }>('HighDifficultyBossGroupTable'),
    table<{ gameList: { gameId: string; difficultyName: TextReference; sortId: number }[] }>(
      'HighDifficultyBossGameTable',
    ),
  ]);
  // 同期可包含多个 DungeonSeries；以期内首个原生系列作为选择器入口。
  const seriesByPeriod = new Map<string, string>();
  for (const [id, row] of Object.entries(monuments).sort(
    ([a], [b]) => (series[a]?.sortId ?? 0) - (series[b]?.sortId ?? 0) || a.localeCompare(b),
  )) {
    if (!seriesByPeriod.has(row.hdId)) seriesByPeriod.set(row.hdId, id);
  }
  const bossByStage = new Map(
    Object.entries(bossGames).flatMap(([id, boss]) =>
      boss.gameList.map(game => {
        const group = bossGroups[id];
        if (!group || monuments[dungeons[game.gameId]?.dungeonSeriesId ?? '']?.hdId !== group.hdId)
          throw new Error(`${game.gameId}: invalid monument boss group ${id}`);
        return [game.gameId, { groupId: id, name: group.bossName, game }] as const;
      }),
    ),
  );
  function groupId(id: string, stage: StageSource): string {
    const boss = bossByStage.get(id);
    if (boss) return boss.groupId;
    if (stage.dungeonCategory === 'dungeon_seasontower') return towerGroupByStage.get(id) ?? id;
    if (stage.dungeonCategory === 'dungeon_highdifficulty' && stage.sceneId)
      return `${stage.dungeonSeriesId}:${stage.sceneId}`;
    if (
      stage.dungeonCategory === 'dungeon_resource' ||
      stage.dungeonCategory === 'dungeon_bossrush'
    )
      return stage.dungeonSeriesId;
    return id;
  }
  const groupBase = new Map<string, StageSource>();
  for (const [id, stage] of Object.entries(dungeons).sort(([a], [b]) => a.localeCompare(b))) {
    const key = groupId(id, stage);
    if (!groupBase.has(key)) groupBase.set(key, stage);
  }
  function name(key: string, value: TextReference | undefined, fallback: string) {
    messages['zh-CN'][key] = cn[value?.id ?? ''] || value?.text || fallback;
    messages.en[key] = en[value?.id ?? ''] || value?.text || fallback;
    return key;
  }
  function groupName(id: string, stage: StageSource, seriesName: TextReference | undefined) {
    const key = groupId(id, stage);
    const boss = bossByStage.get(id);
    if (boss) return name(`group_${key}`, boss.name, id);
    const nameKey = name(
      `group_${key}`,
      stage.dungeonCategory === 'dungeon_resource' || stage.dungeonCategory === 'dungeon_bossrush'
        ? seriesName
        : stageName(id, groupBase.get(key) ?? stage),
      id,
    );
    if (stage.dungeonCategory === 'dungeon_seasontower') {
      // 分组身份来自原生 stars；只对已确定同组的本地化标题去掉共有前缀之后的难度文字。
      const members = Object.entries(dungeons).filter(
        ([memberId, member]) => groupId(memberId, member) === key,
      );
      for (const [locale, texts] of [
        ['zh-CN', cn],
        ['en', en],
      ] as const) {
        const labels = members.map(
          ([, member]) => texts[member.dungeonName.id ?? ''] || member.dungeonName.text || '',
        );
        if (labels.length < 2 || labels.some(label => !label)) continue;
        let prefix = labels[0]!;
        for (const label of labels.slice(1))
          while (prefix && !label.startsWith(prefix)) prefix = prefix.slice(0, -1);
        prefix = prefix.replace(/[\s·:：\-–—(（]+$/u, '');
        if (prefix) messages[locale][nameKey] = prefix;
      }
    }
    return nameKey;
  }
  function stageName(id: string, stage: StageSource): TextReference {
    const textId = enemyStageNameTextIds[id];
    return textId ? { id: textId } : stage.dungeonName;
  }
  const sceneSpawners = new Map(
    await Promise.all(
      [
        ...new Set(
          Object.values(dungeons)
            .map(stage => stage.sceneId)
            .filter((id): id is string => Boolean(id)),
        ),
      ].map(
        async scene =>
          [
            scene,
            args.spawnerDirectory ? await loadSceneSpawners(args.spawnerDirectory, scene) : [],
          ] as const,
      ),
    ),
  );
  const placedByScene = new Map(
    await Promise.all(
      [...new Set([...bossByStage.keys()].map(id => dungeons[id]!.sceneId!))].map(
        async scene =>
          [
            scene,
            args.levelDirectory ? await loadSceneEnemies(args.levelDirectory, scene) : [],
          ] as const,
      ),
    ),
  );
  // 合约展示表省略了部分实际刷怪种类；补齐后沿用统一的属性与数量解析。
  for (const [id, stage] of Object.entries(dungeons)) {
    if (stage.dungeonCategory !== 'dungeon_contract' && !bossByStage.has(id)) continue;
    const roster = collectSpawnerEnemies(sceneSpawners.get(stage.sceneId ?? '') ?? []);
    if (stage.dungeonCategory === 'dungeon_contract' && roster.length) {
      stage.enemyIds = roster.map(entry => entry.enemyId);
      stage.enemyLevels = roster.map(entry => entry.level);
    }
    if (bossByStage.has(id)) {
      // Boss 展示表列的是模板；同场景、同等级的刷怪库或放置实例确定关卡变种。
      const spawned = [
        ...roster,
        ...(placedByScene.get(stage.sceneId!) ?? []).map(e => ({
          enemyId: e.entityDataIdKey,
          level: e.level,
        })),
      ];
      stage.enemyIds = stage.enemyIds.map((displayId, i) => {
        const ids = new Set(
          spawned
            .filter(
              e =>
                e.level === stage.enemyLevels[i] &&
                enemies[e.enemyId]?.templateId === enemies[displayId]?.templateId,
            )
            .map(e => e.enemyId),
        );
        if (ids.size !== 1)
          throw new Error(
            `${id}: expected one spawned identity for ${displayId} at level ${stage.enemyLevels[i]}, found ${ids.size}`,
          );
        return [...ids][0]!;
      });
    }
  }
  const buffSources = new Map<string, Record<string, unknown>>();
  if (args.buffDirectory) {
    const ids = new Set(
      [...sceneSpawners.values()].flatMap(spawners =>
        spawners.flatMap(spawner =>
          spawner.enemyLibrary.flatMap(entry =>
            (entry.bornBuffList ?? []).map(buff => buff.buffId),
          ),
        ),
      ),
    );
    for (const scene of placedByScene.values())
      for (const enemy of scene) for (const buff of enemy.buffs) ids.add(buff.buffId);
    for (const id of ids)
      buffSources.set(
        id,
        JSON.parse(await readFile(join(args.buffDirectory, `${id}.json`), 'utf8')),
      );
  }
  const stages = Object.entries(dungeons)
    .flatMap(([id, stage]) => {
      if (
        !stage.enemyIds?.length ||
        ![
          'dungeon_highdifficulty',
          'dungeon_seasontower',
          'dungeon_resource',
          'dungeon_ss',
          'dungeon_bossrush',
          'dungeon_contract',
        ].includes(stage.dungeonCategory)
      )
        return [];
      const seriesId =
        seriesByPeriod.get(monuments[stage.dungeonSeriesId]?.hdId ?? '') ?? stage.dungeonSeriesId;
      const group = series[seriesId];
      const boss = bossByStage.get(id);
      return [
        {
          id,
          groupId: groupId(id, stage),
          difficultyOrder: boss?.game.sortId ?? towerDifficulty.get(id) ?? stage.sortId,
          groupNameKey: groupName(id, stage, group?.name),
          seriesId,
          nameKey: name(`stage_${id}`, stageName(id, stage), id),
          difficultyNameKey: name(
            `difficulty_${id}`,
            boss?.game.difficultyName ?? stage.dungeonLevelDesc,
            '',
          ),
          seriesNameKey: name(
            `series_${seriesId}`,
            group?.name?.id || group?.name?.text ? group.name : stage.dungeonName,
            stage.dungeonSeriesId,
          ),
          sort: stage.sortId,
          enemies: stage.enemyIds.flatMap((enemyId, index) => {
            const enemy = enemies[enemyId];
            if (!enemy) throw new Error(`${id}: missing enemy ${enemyId}`);
            const base = enemies[enemy.templateId];
            if (!base) throw new Error(`${id}: missing base enemy ${enemy.templateId}`);
            const placed = (placedByScene.get(stage.sceneId ?? '') ?? []).filter(
              e => e.entityDataIdKey === enemyId && e.level === stage.enemyLevels[index],
            );
            const variants = placed.length
              ? [...new Map(placed.map(e => [JSON.stringify(e.buffs), e.buffs])).values()]
              : findSpawnerBuffs(
                  sceneSpawners.get(stage.sceneId ?? '') ?? [],
                  stage.enemyIds,
                  enemyId,
                  stage.enemyLevels[index] ?? 0,
                );
            return variants.map(buffs => {
              const signature = createHash('sha256')
                .update(JSON.stringify(buffs))
                .digest('hex')
                .slice(0, 12);
              const spawnId = `${enemyId}:${stage.enemyLevels[index] ?? 'unknown'}:${signature}`;
              const birthBuffs = buffs.flatMap((buff, buffIndex) => {
                const source = buffSources.get(buff.buffId);
                if (!source) return [];
                const option = projectEnemyBirthBuffOption(
                  source,
                  buff.buffId,
                  'stage',
                  buffIndex,
                  Object.fromEntries(
                    buff.blackboard
                      .filter(value => !value.useString)
                      .map(value => [value.key, value.valueFloat]),
                  ),
                  args.buffDirectory,
                );
                return option ? [option] : [];
              });
              return {
                id: spawnId,
                ...(birthBuffs.length ? { birthBuffs } : {}),
                source: {
                  stageId: id,
                  spawnId,
                  enemyId,
                  templateId: enemy.templateId.replaceAll('_', '-'),
                },
                level: stage.enemyLevels[index] ?? null,
                count: placed.length
                  ? placed.filter(e => JSON.stringify(e.buffs) === JSON.stringify(buffs)).length
                  : findSpawnerCount(
                      sceneSpawners.get(stage.sceneId ?? '') ?? [],
                      stage.enemyIds,
                      stage.enemyLevels,
                      enemyId,
                      stage.enemyLevels[index] ?? 0,
                      buffs,
                    ),
                nameKey: name(`enemy_${enemyId}`, displays[enemyId]?.name, ''),
                definitionId: enemyId.replaceAll('_', '-'),
              };
            });
          }),
        },
      ];
    })
    .sort(
      (a, b) => a.seriesId.localeCompare(b.seriesId) || a.sort - b.sort || a.id.localeCompare(b.id),
    );
  const output = join(args.outputDirectory, 'stages.generated.ts');
  async function publish(output: string, content: string) {
    if (args.check) {
      if ((await readFile(output, 'utf8')) !== content) {
        throw new Error(`${output}: enemy stage catalog is stale`);
      }
    } else {
      await mkdir(dirname(output), { recursive: true });
      await writeFile(output, content, 'utf8');
    }
  }
  const groups = new Map<string, typeof stages>();
  for (const stage of stages) {
    const file = stageFileKey(stage.id, stage.seriesId, dungeons[stage.id]!.dungeonCategory);
    const entries = groups.get(file) ?? [];
    entries.push(stage);
    groups.set(file, entries);
  }
  const imports: string[] = [];
  const spreads: string[] = [];
  const files: string[] = [];
  for (const [index, [key, entries]] of [...groups]
    .sort(([a], [b]) => a.localeCompare(b))
    .entries()) {
    const file = join(args.outputDirectory, `stages.${key}.generated.ts`);
    await publish(
      file,
      await formatGeneratedSource(
        `// Generated by generateEnemyStageCatalog.ts.\nimport type { EnemyStageDefinition } from '../../../../packages/game-data-contract/src/enemies';\nexport const stages: readonly EnemyStageDefinition[] = ${JSON.stringify(entries)};\n`,
        file,
      ),
    );
    files.push(file);
    imports.push(`import { stages as group${index} } from './stages.${key}.generated';`);
    spreads.push(`...group${index}`);
  }
  await publish(
    output,
    await formatGeneratedSource(
      `// Generated by generateEnemyStageCatalog.ts.\nimport type { EnemyStageDefinition } from '../../../../packages/game-data-contract/src/enemies';\n${imports.join('\n')}\nconst stages: EnemyStageDefinition[] = [${spreads.join(',')}];\nexport const generatedEnemyStages: readonly EnemyStageDefinition[] = stages.sort((a, b) => a.seriesId.localeCompare(b.seriesId) || a.sort - b.sort || a.id.localeCompare(b.id));\n`,
      output,
    ),
  );
  const expectedFiles = new Set(files.map(file => basename(file)));
  for (const file of await readdir(args.outputDirectory)) {
    if (!/^stages\.[\w-]+\.generated\.ts$/.test(file) || expectedFiles.has(file)) continue;
    if (args.check) throw new Error(`${file}: obsolete enemy stage group`);
    await unlink(join(args.outputDirectory, file));
  }
  const localeDirectory = args.localeDirectory;
  for (const [locale, entries] of Object.entries(messages)) {
    const localeOutput = join(localeDirectory, locale === 'zh-CN' ? 'zh' : locale, 'stages.json');
    // 文本在遍历来源表时收集，落盘顺序不应随来源表的键顺序改变。
    const ordered = Object.fromEntries(
      Object.keys(entries)
        .sort()
        .map(key => [key, entries[key]]),
    );
    await publish(localeOutput, await formatGeneratedSource(JSON.stringify(ordered), localeOutput));
  }
  return {
    stageCount: stages.length,
    files,
    output,
    stages,
  };
}

/** 分类来自原生关卡类别；丰碑按系列、合约按关卡身份分别发布。 */
function stageFileKey(id: string, seriesId: string, category: string): string {
  switch (category) {
    case 'dungeon_resource':
    case 'dungeon_ss':
      return 'protocol-spaces';
    case 'dungeon_bossrush':
      return seriesId.includes('_minibossrush') ? 'danger-fragments' : 'danger-recurrence';
    case 'dungeon_highdifficulty':
      return `monument-${seriesId}`;
    case 'dungeon_contract':
      return `contract-${id}`;
    case 'dungeon_seasontower':
      return 'war-echoes';
    default:
      throw new Error(`unsupported stage category '${category}'`);
  }
}

if (process.argv[1] && pathToFileURL(resolve(process.argv[1])).href === import.meta.url) {
  if (!process.argv[2])
    throw new Error('Usage: generateEnemyStageCatalog.ts <TableCfg directory> [--check]');
  console.log(
    await generateEnemyStageCatalog({
      tablesDirectory: resolve(process.argv[2]),
      spawnerDirectory: resolve(process.argv[2], '../SpawnerConfig'),
      levelDirectory: resolve(process.argv[2], '../LevelData'),
      buffDirectory: resolve(process.argv[2], '../BuffData'),
      outputDirectory: resolve('src/data/enemies/generated'),
      localeDirectory: resolve('src/i18n/game-locales'),
      check: process.argv.includes('--check'),
    }),
  );
}
