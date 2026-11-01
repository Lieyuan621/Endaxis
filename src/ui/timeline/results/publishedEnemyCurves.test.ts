import { expect, it } from 'vitest';
import { createEmptyScenario } from '../../../core/project/createProject';
import { firstScenarioEnemy } from '../../../core/project/level';
import { gameDataRepository } from '../../../data/gameDataRepository';
import { createScenarioSimulationService } from '../../../application/simulation/createScenarioSimulationService';
import { projectPublishedEnemyCurves } from './publishedEnemyCurves';

it('重排草稿后仍按发布的敌人身份和初值读取曲线，新敌人不回退到首敌', async () => {
  const scenario = createEmptyScenario('curves', 'curves');
  const first = firstScenarioEnemy(scenario);
  const second = structuredClone(first);
  second.id = 'enemy:second';
  second.enemy.editable.hp = 200000;
  second.enemy.editable.stagger.maximum = 600;
  scenario.level = { kind: 'multiEnemies', enemies: [first, second] };
  const published = {
    scenario,
    run: await createScenarioSimulationService(gameDataRepository).simulate(scenario, 1),
  };
  const draft = structuredClone(scenario);
  if (draft.level.kind !== 'multiEnemies') throw new Error('expected multiple enemies');
  draft.level.enemies.reverse();
  draft.battle.prepFrames = 600;
  const curves = projectPublishedEnemyCurves(published, firstScenarioEnemy(draft).id)!;
  expect(curves.health.maxValue).toBe(200000);
  expect(curves.poise.maxValue).toBe(600);
  expect(curves.health.points[0]!.frame).toBe(-scenario.battle.prepFrames);
  expect(projectPublishedEnemyCurves(published, 'enemy:new')).toBeNull();
  expect(projectPublishedEnemyCurves(published, first.id)!.health.maxValue).toBe(
    first.enemy.editable.hp,
  );
});
