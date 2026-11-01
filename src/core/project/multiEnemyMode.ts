import { firstScenarioEnemy, levelEnemies } from './level';
import { resolveScenarioInitialFrame } from './skillCastPlacement';
import type { ScenarioDocument } from './schema';

export function requiresMultiEnemyMode(scenario: ScenarioDocument): boolean {
  if (levelEnemies(scenario.level).length > 1) return true;
  const life = firstScenarioEnemy(scenario).enemy.lifecycle;
  return (
    life !== undefined &&
    (life.spawnFrame !== resolveScenarioInitialFrame(scenario) ||
      life.presenceChanges.length > 0 ||
      life.deathFrame != null)
  );
}

export function isMultiEnemyModeEnabled(scenario: ScenarioDocument): boolean {
  return scenario.level.kind === 'multiEnemies';
}
