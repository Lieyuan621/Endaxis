import type { PublishedScenarioSimulation } from '../useScenarioSimulation';
import type { TimelineBattleLogSnapshot } from './timelineBattleLogProjection';
import type { PublishedOperatorMetadata } from './publishedOperatorMetadata';
import {
  projectTimelineEditor,
  type TimelineOperatorIndex,
  type TimelineSkillCastViewModel,
  type TimelineTrackViewModel,
} from '../timelineEditorViewModel';

export interface PublishedOperatorName {
  readonly slug: string | null;
  readonly assetSlug: string | null;
  readonly displayName: string | undefined;
}

export interface PublishedBattleLogLabels {
  skill: (cast: TimelineSkillCastViewModel, track: TimelineTrackViewModel) => string;
  operator: (name: PublishedOperatorName) => string;
}

/** 捕获不随编辑漂移的事实；显示时允许使用当前语言，无需重跑模拟或刷新日志。 */
export function capturePublishedBattleLog(
  published: PublishedScenarioSimulation,
  index: TimelineOperatorIndex,
  operators: ReadonlyMap<string, PublishedOperatorMetadata>,
  labels: PublishedBattleLogLabels,
): TimelineBattleLogSnapshot {
  const view = projectTimelineEditor(published.scenario, index);
  const tracks = view.tracks.map(track => {
    const definition = track.operatorSlug === null ? null : operators.get(track.operatorSlug);
    return {
      track,
      name: {
        slug: track.operatorSlug,
        assetSlug: definition?.assetSlug ?? track.operatorSlug,
        displayName: definition?.displayName,
      },
    };
  });
  return {
    history: published.run.receiptHistory,
    resolveCastOwners: () =>
      tracks.flatMap(({ track, name }) =>
        track.skillCasts.map(cast => ({
          castId: cast.id,
          sourceId: track.operatorInstanceId,
          label: labels.skill(cast, track),
          operatorLabel: labels.operator(name),
        })),
      ),
  };
}
