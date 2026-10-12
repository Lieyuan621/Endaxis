import { compileResolvedScenarioTimeline } from '../core/compiler/compileScenarioTimeline';
import { resolveScenarioBuilds } from '../core/compiler/resolveScenarioBuilds';
import type { GameDataRepository } from '../core/game-data/gameDataRepository';
import type { ScenarioDocument } from '../core/project/schema';

type TimelineTestIndex = Pick<
  GameDataRepository,
  | 'actionPrograms'
  | 'getOperator'
  | 'getCommonDefinitionSources'
  | 'getCommonAbilityEntityDefinitions'
> &
  Partial<Pick<GameDataRepository, 'getWeapon' | 'getGear' | 'getGearSet'>>;

/** 测试可省略未使用的装备目录；构筑和时间轴均走正式编译入口。 */
export function compileTimeline(scenario: ScenarioDocument, index: TimelineTestIndex) {
  return compileResolvedScenarioTimeline(
    resolveScenarioBuilds(scenario, {
      getWeapon: () => null,
      getGear: () => null,
      getGearSet: () => null,
      ...index,
    }),
    index.getCommonAbilityEntityDefinitions?.(),
    {
      programs: index.actionPrograms,
      commonDefinitionSources: index.getCommonDefinitionSources(),
    },
  );
}
