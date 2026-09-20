/**
 * 将旧版单块技能按当前技能组的递归输入规则展开。
 *
 * 映射只声明技能组和形态；本层复用编辑器的正式递归规划器，根据模拟回执选择每一段，
 * 不在转换器里复制干员技能路由，也不向项目存档增加旧版专用字段。
 */
import type { GameDataRepository } from '../../core/game-data/gameDataRepository';
import type { EndaxisProjectDocument } from '../../core/project/schema';
import {
  planRecursiveSkillChain,
  type RecursiveSkillChain,
} from '../simulation/recursiveSkillChain';
import { resolveSkillGroupPlacementSkills } from '../editor/skillGroupPlacement';
import type { LegacyRetimingSimulationRunner } from './heuristicRetiming';

type UnknownRecord = Record<string, unknown>;

export interface LegacySequenceExpansion {
  readonly scenarioId: string;
  readonly trackIndex: number;
  readonly actionIndex: number;
  readonly seedCastId: string;
  readonly skillCastIds: readonly string[];
}

function record(value: unknown): UnknownRecord | null {
  return value !== null && typeof value === 'object' && !Array.isArray(value)
    ? (value as UnknownRecord)
    : null;
}

function records(value: unknown): UnknownRecord[] {
  return Array.isArray(value) ? value.map(record).filter(value => value !== null) : [];
}

/** 原地替换场景；失败时只返回问题，调用方不得继续生成残缺项目。 */
export function expandLegacyRecursiveSkillSequences(
  project: EndaxisProjectDocument,
  preparedSource: unknown,
  repository: GameDataRepository,
  runSimulation: LegacyRetimingSimulationRunner,
): { expansions: LegacySequenceExpansion[]; issues: { path: string; message: string }[] } {
  const root = record(preparedSource);
  const sourceScenarios = records(root?.scenarioList);
  const expansions: LegacySequenceExpansion[] = [];
  const issues: { path: string; message: string }[] = [];

  for (const scenario of project.scenarios) {
    const sourceWrapper = sourceScenarios.find(wrapper => wrapper.id === scenario.id);
    const sourceData = record(sourceWrapper?.data);
    if (sourceData === null) continue;
    const sourceTracks = records(sourceData.tracks);
    for (const [trackIndex, sourceTrack] of sourceTracks.entries()) {
      const projectTrack = scenario.tracks[trackIndex];
      if (projectTrack == null) continue;
      const operatorSlug = projectTrack.operator?.operatorSlug;
      const operator = operatorSlug === undefined ? null : repository.getOperator(operatorSlug);
      for (const [actionIndex, action] of records(sourceTrack.actions).entries()) {
        const target = record(action.convertedSequence);
        if (target?.kind !== 'operatorSkillSequence') continue;
        const path = `${scenario.id}/${trackIndex}/${actionIndex}`;
        const skillGroupKey =
          typeof target.skillGroupKey === 'string' ? target.skillGroupKey : undefined;
        const variantKey = typeof target.variantKey === 'string' ? target.variantKey : undefined;
        const group = operator?.skillGroups.find(candidate => candidate.key === skillGroupKey);
        const variant = group?.variants?.find(candidate => candidate.key === variantKey);
        const policy = variantKey === undefined ? group?.placementPolicy : variant?.placementPolicy;
        if (group === undefined || policy?.kind !== 'recursiveInput') continue;
        const skills = resolveSkillGroupPlacementSkills(group, variantKey);
        const seedCastId = `legacy:${scenario.id}:track:${trackIndex}:cast:${actionIndex}`;
        const extension: RecursiveSkillChain = {
          allowedSkillKeys: skills.map(skill => skill.key),
          terminalSkillKey: policy.terminalSkillKey,
          reservedCastIds: Array.from(
            { length: policy.maxSegments - 1 },
            (_, index) => `${seedCastId}:sequence:${index + 1}`,
          ),
        };
        const planned = planRecursiveSkillChain({
          scenario,
          seedCastId,
          extension,
          endFrame: scenario.battle.durationFrames,
          run: runSimulation,
          checkCancelled: () => {},
        });
        if (!planned.complete) {
          issues.push({ path, message: '当前原生递归输入未能到达收尾技能，不能展开旧技能块' });
          continue;
        }
        Object.assign(scenario, planned.scenario);
        expansions.push({
          scenarioId: scenario.id,
          trackIndex,
          actionIndex,
          seedCastId,
          skillCastIds: planned.skillCastIds,
        });
      }
    }
  }
  return { expansions, issues };
}
