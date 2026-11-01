import type { ScenarioDocument } from './schema';
import { levelEnemies } from './level';

export function scenarioEnemyOrder(scenario: ScenarioDocument): string[] {
  return levelEnemies(scenario.level).map(enemy => enemy.id);
}

export function removeScenarioEnemy(scenario: ScenarioDocument, id: string): ScenarioDocument {
  if (scenario.level.kind !== 'multiEnemies' || scenario.level.enemies.length <= 1) return scenario;
  const enemies = scenario.level.enemies.filter(enemy => enemy.id !== id);
  if (enemies.length === scenario.level.enemies.length) return scenario;
  return {
    ...scenario,
    level: { kind: 'multiEnemies', enemies },
    battle: {
      ...scenario.battle,
      enemyTargetSwitches: scenario.battle.enemyTargetSwitches?.filter(
        marker => marker.targetId !== id,
      ),
    },
  };
}
