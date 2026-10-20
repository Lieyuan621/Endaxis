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
      groupMap: Record<
        string,
        {
          actionMap: Record<string, { libraryKey?: string }>;
        }
      >;
    }
  >;
}
export interface StageEnemyAttributes {
  id: string;
  enemyId: string;
  buffs: SpawnerBuff[];
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
      !spawner.enemyLibrary.every(
        entry => enemies.includes(entry.enemyId) && entry.enemyLevel === level,
      )
    )
      continue;
    const used = new Set(
      Object.values(spawner.waveMap).flatMap(wave =>
        Object.values(wave.groupMap).flatMap(group =>
          Object.values(group.actionMap).flatMap(action =>
            action.libraryKey ? [action.libraryKey] : [],
          ),
        ),
      ),
    );
    for (const entry of spawner.enemyLibrary) {
      if (entry.enemyId !== enemyId || !used.has(entry.key)) continue;
      const buffs = entry.bornBuffList ?? [];
      matches.set(JSON.stringify(buffs), buffs);
    }
  }
  return matches.size ? [...matches.values()] : [[]];
}
