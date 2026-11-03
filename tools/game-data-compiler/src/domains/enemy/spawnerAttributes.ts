import { readdir, readFile } from 'node:fs/promises';
import { join } from 'node:path';

export interface SpawnerBuff {
  buffId: string;
  blackboard: { key: string; valueFloat: number; useString: boolean }[];
}
interface Spawner {
  enemyLibrary: { enemyId: string; enemyLevel: number; key: string; bornBuffList: SpawnerBuff[] }[];
  waveMap: Record<
    string,
    {
      repeatable?: boolean;
      defaultDisable?: boolean;
      groupMap: Record<
        string,
        {
          defaultDisable?: boolean;
          actionMap: Record<
            string,
            { libraryKey?: string; spawnCount?: number; defaultDisable?: boolean }
          >;
        }
      >;
    }
  >;
}
/** 与 AKEDatabase 一样按场景、敌人和等级匹配；仅使用实际被刷怪动作引用的库条目。 */
export async function loadSceneSpawners(directory: string, scene: string): Promise<Spawner[]> {
  let files: string[];
  try {
    files = await readdir(join(directory, scene));
  } catch (error) {
    if (error instanceof Error && 'code' in error && error.code === 'ENOENT') return [];
    throw error;
  }
  return Promise.all(
    files
      .filter(file => file.endsWith('.json'))
      .sort()
      .map(
        async file => JSON.parse(await readFile(join(directory, scene, file), 'utf8')) as Spawner,
      ),
  );
}

export function findSpawnerBuffs(
  spawners: readonly Spawner[],
  enemies: readonly string[],
  enemyId: string,
  level: number,
): SpawnerBuff[][] {
  const matches = new Map<string, SpawnerBuff[]>();
  for (const spawner of spawners) {
    if (
      !spawner.enemyLibrary.length ||
      !usedSpawnerEntries(spawner).every(
        entry => enemies.includes(entry.enemyId) && entry.enemyLevel === level,
      )
    )
      continue;
    for (const entry of usedSpawnerEntries(spawner)) {
      if (entry.enemyId !== enemyId) continue;
      const buffs = entry.bornBuffList ?? [];
      matches.set(JSON.stringify(buffs), buffs);
    }
  }
  return matches.size ? [...matches.values()] : [[]];
}

/** 只统计可唯一匹配且没有循环/禁用分支的刷怪配置；未知不回退成一只。 */
export function findSpawnerCount(
  spawners: readonly Spawner[],
  enemyIds: readonly string[],
  levels: readonly number[],
  enemyId: string,
  level: number,
  buffs: readonly SpawnerBuff[],
): number | null {
  const candidates = spawners.filter(
    spawner =>
      spawner.enemyLibrary.length > 0 &&
      usedSpawnerEntries(spawner).every(entry =>
        enemyIds.some((id, index) => id === entry.enemyId && levels[index] === entry.enemyLevel),
      ),
  );
  if (candidates.length !== 1) return null;
  const spawner = candidates[0]!;
  const library = new Map(spawner.enemyLibrary.map(entry => [entry.key, entry]));
  let count = 0;
  for (const wave of Object.values(spawner.waveMap)) {
    if (wave.repeatable || wave.defaultDisable) return null;
    for (const group of Object.values(wave.groupMap)) {
      if (group.defaultDisable) return null;
      for (const action of Object.values(group.actionMap)) {
        if (!action.libraryKey) continue;
        const entry = library.get(action.libraryKey);
        if (!entry) return null;
        if (
          action.defaultDisable ||
          !Number.isSafeInteger(action.spawnCount) ||
          action.spawnCount! < 0
        )
          return null;
        if (
          entry.enemyId === enemyId &&
          entry.enemyLevel === level &&
          JSON.stringify(entry.bornBuffList ?? []) === JSON.stringify(buffs)
        )
          count += action.spawnCount!;
      }
    }
  }
  return count > 0 ? count : null;
}

/** 合约的展示名单不完整，敌人种类与等级取实际刷怪动作引用的库条目。 */
export function collectSpawnerEnemies(spawners: readonly Spawner[]) {
  const entries = new Map<string, { enemyId: string; level: number }>();
  for (const spawner of spawners) {
    for (const entry of usedSpawnerEntries(spawner)) {
      entries.set(`${entry.enemyId}:${entry.enemyLevel}`, {
        enemyId: entry.enemyId,
        level: entry.enemyLevel,
      });
    }
  }
  return [...entries.values()];
}

function usedSpawnerEntries(spawner: Spawner) {
  const used = new Set(
    Object.values(spawner.waveMap).flatMap(wave =>
      Object.values(wave.groupMap).flatMap(group =>
        Object.values(group.actionMap).flatMap(action =>
          action.libraryKey ? [action.libraryKey] : [],
        ),
      ),
    ),
  );
  return spawner.enemyLibrary.filter(entry => used.has(entry.key));
}
