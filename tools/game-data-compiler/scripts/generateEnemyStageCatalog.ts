import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { resolve, join, dirname } from 'node:path';
import { pathToFileURL } from 'node:url';
import { formatGeneratedSource } from '../src/compiler/publication/formatGeneratedSource.ts';
import { createHash } from 'node:crypto';
import {
  findSpawnerBuffs,
  loadSceneSpawners,
  type StageEnemyAttributes,
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
  localeDirectory?: string;
  spawnerDirectory?: string;
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
    table<{ name: TextReference }>('DungeonSeriesTable'),
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
  function groupId(id: string, stage: StageSource): string {
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
    const nameKey = name(
      `group_${key}`,
      stage.dungeonCategory === 'dungeon_resource' || stage.dungeonCategory === 'dungeon_bossrush'
        ? seriesName
        : groupBase.get(key)?.dungeonName,
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
  const stageAttributes: StageEnemyAttributes[] = [];
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
        ].includes(stage.dungeonCategory)
      )
        return [];
      const group = series[stage.dungeonSeriesId];
      return [
        {
          id,
          groupId: groupId(id, stage),
          difficultyOrder: towerDifficulty.get(id) ?? stage.sortId,
          groupNameKey: groupName(id, stage, group?.name),
          seriesId: stage.dungeonSeriesId,
          nameKey: name(`stage_${id}`, stage.dungeonName, id),
          difficultyNameKey: name(`difficulty_${id}`, stage.dungeonLevelDesc, ''),
          seriesNameKey: name(
            `series_${stage.dungeonSeriesId}`,
            group?.name,
            stage.dungeonSeriesId,
          ),
          sort: stage.sortId,
          enemies: stage.enemyIds.flatMap((enemyId, index) => {
            const enemy = enemies[enemyId];
            if (!enemy) throw new Error(`${id}: missing enemy ${enemyId}`);
            const base = enemies[enemy.templateId];
            if (!base) throw new Error(`${id}: missing base enemy ${enemy.templateId}`);
            const differences = {
              attributeTemplate: enemy.attrTemplateId !== base.attrTemplateId,
              attributeModifiers:
                JSON.stringify(enemy.attrModifiers) !== JSON.stringify(base.attrModifiers),
              bornBuffs: JSON.stringify(enemy.bornBuffs) !== JSON.stringify(base.bornBuffs),
            };
            const equivalent = !Object.values(differences).some(Boolean);
            const variants = findSpawnerBuffs(
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
              const scopedId = buffs.length ? `${enemyId}__${id}__${signature}` : undefined;
              if (scopedId) stageAttributes.push({ id: scopedId, enemyId, buffs });
              return {
                source: {
                  stageId: id,
                  enemyId,
                  templateId: enemy.templateId.replaceAll('_', '-'),
                },
                level: stage.enemyLevels[index] ?? null,
                nameKey: name(`enemy_${enemyId}`, displays[enemyId]?.name, ''),
                // 保留变体身份；第一阶段仅模拟其属性差异，不执行出生 Buff 的机制。
                usesBaseDefinition: equivalent && !scopedId,
                definitionId: scopedId
                  ? scopedId.replaceAll('_', '-')
                  : equivalent
                    ? enemy.templateId.replaceAll('_', '-')
                    : enemyId.replaceAll('_', '-'),
                differences,
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
  const content = await formatGeneratedSource(
    `// Generated by generateEnemyStageCatalog.ts.\nexport const generatedEnemyStages = ${JSON.stringify(stages)};\n`,
    output,
  );
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
  await publish(output, content);
  const localeDirectory =
    args.localeDirectory ?? resolve(args.outputDirectory, '../../../i18n/game-locales');
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
    output,
    stages,
    stageAttributes,
  };
}

if (process.argv[1] && pathToFileURL(resolve(process.argv[1])).href === import.meta.url) {
  if (!process.argv[2])
    throw new Error('Usage: generateEnemyStageCatalog.ts <TableCfg directory> [--check]');
  console.log(
    await generateEnemyStageCatalog({
      tablesDirectory: resolve(process.argv[2]),
      outputDirectory: resolve('src/data/enemies/generated'),
      check: process.argv.includes('--check'),
    }),
  );
}
