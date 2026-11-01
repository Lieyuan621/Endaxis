import type { EnemyInstanceDocument, LevelDocument, ScenarioDocument } from './schema';

export function levelEnemies(level: LevelDocument): readonly EnemyInstanceDocument[] {
  return level.kind === 'singleEnemy' ? [level.enemy] : level.enemies;
}

export function firstScenarioEnemy(scenario: ScenarioDocument): EnemyInstanceDocument {
  const enemy = levelEnemies(scenario.level)[0];
  if (!enemy) throw new Error('a level requires at least one enemy');
  return enemy;
}

export function mapLevelEnemies(
  level: LevelDocument,
  update: (enemy: EnemyInstanceDocument) => EnemyInstanceDocument,
): LevelDocument {
  return level.kind === 'singleEnemy'
    ? { kind: 'singleEnemy', enemy: update(level.enemy) }
    : { kind: 'multiEnemies', enemies: level.enemies.map(update) };
}
