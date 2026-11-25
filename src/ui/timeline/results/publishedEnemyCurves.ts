import { projectEnemyHealthCurveFromReceipt } from '../../../core/projection/enemyHealthCurves';
import { projectPoiseCurveFromReceipt } from '../../../core/projection/poiseCurves';
import type { PublishedScenarioSimulation } from '../useScenarioSimulation';

/** 曲线的实例身份、初值和准备区间全部来自同一次发布，不受草稿排序影响。 */
export function projectPublishedEnemyCurves(
  published: PublishedScenarioSimulation | null,
  enemyId: string,
) {
  const vitals = published?.run.enemyVitalsById[enemyId];
  if (!published || !vitals) return null;
  const entries = published.run.receiptHistory.toArray();
  const initialFrame = -published.scenario.battle.prepFrames;
  return {
    health: projectEnemyHealthCurveFromReceipt(
      { health: vitals.initialHealth, maxHealth: vitals.maxHealth },
      entries,
      initialFrame,
      enemyId,
    ),
    poise: projectPoiseCurveFromReceipt(
      { poise: vitals.initialPoise, maxPoise: vitals.maxPoise },
      entries,
      initialFrame,
      enemyId,
    ),
  };
}
