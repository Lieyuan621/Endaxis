/** 干员预设只保存构筑输入，不包含排轴、初始战斗状态或模拟结果。 */
import type {
  OperatorInstanceDocument,
  ScenarioDocument,
  TrackDocument,
  TrackIndex,
} from '../../core/project/schema';
import type { GameDataRepository } from '../../core/game-data/gameDataRepository';
import { resolveScenarioBuilds } from '../../core/compiler/resolveScenarioBuilds';
import { resolveOperatorMaxUltimateEnergy } from '../../core/compiler/resolveScenarioResourceRules';

export interface OperatorBuildPreset {
  id: string;
  name: string;
  build: Pick<TrackDocument, 'weapon' | 'gears'> & { operator: OperatorInstanceDocument };
}

export function captureOperatorBuild(track: TrackDocument): OperatorBuildPreset['build'] {
  if (!track.operator) throw new Error('No operator selected');
  return JSON.parse(
    JSON.stringify({ operator: track.operator, weapon: track.weapon, gears: track.gears }),
  );
}

/** 整套替换构筑；复制输入保证预设、当前方案和撤销快照互不影响。 */
export function applyOperatorBuildPreset(
  scenario: ScenarioDocument,
  trackIndex: TrackIndex,
  preset: OperatorBuildPreset,
  gameData: GameDataRepository,
): ScenarioDocument {
  const track = scenario.tracks[trackIndex];
  if (!track?.operator || track.operator.operatorSlug !== preset.build.operator.operatorSlug) {
    throw new Error('Preset operator does not match the selected track');
  }
  if (scenario.inheritance !== undefined) throw new Error('Inherited configuration is read-only');
  const build: OperatorBuildPreset['build'] = JSON.parse(JSON.stringify(preset.build));
  const definition = gameData.getOperator(build.operator.operatorSlug);
  if (!definition) throw new Error(`Missing operator: ${build.operator.operatorSlug}`);
  const maximum =
    track.initialState.maxUltimateEnergyOverride ??
    resolveOperatorMaxUltimateEnergy(definition, build.operator);
  const tracks = [...scenario.tracks] as ScenarioDocument['tracks'];
  tracks[trackIndex] = {
    ...track,
    operator: build.operator,
    weapon: build.weapon,
    gears: build.gears,
    initialState: {
      ...track.initialState,
      ultimateEnergy:
        maximum === undefined
          ? track.initialState.ultimateEnergy
          : Math.min(track.initialState.ultimateEnergy, maximum),
    },
  };
  const result = { ...scenario, tracks };
  // 复用正式构筑解析，缺失资源或不兼容装备不能部分应用。
  resolveScenarioBuilds(result, gameData);
  return result;
}
