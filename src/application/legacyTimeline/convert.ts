import { prepareLegacySource, type ConversionMappings } from './sourcePreparation';
import { createLegacyProjectImporter } from './projectConversion';
import { parseProjectDocument } from '../../core/project/serialization';
import type { GameDataRepository } from '../../core/game-data/gameDataRepository';
import { resolveScenarioBuilds } from '../../core/compiler/resolveScenarioBuilds';
import { resolveOperatorMaxUltimateEnergy } from '../../core/compiler/resolveScenarioResourceRules';
import type { EndaxisProjectDocument } from '../../core/project/schema';
import {
  retimeLegacyProjectBySimulation,
  type LegacyRuntimeReplacementResolver,
  type LegacyTimingMode,
} from './heuristicRetiming';
import { ScenarioSimulationService } from '../simulation/scenarioSimulationService';
import { CheckpointRetimingSession } from './checkpointRetiming';
import { skillSettings, skillSettingResources } from '../../data/combat/skillSettings';
import { elementalAttachments } from '../../data/buffs/elementalAttachments';
import { compoundStatusFactories } from '../../data/buffs/compoundStatusFactories';
import { MechanicAdapterRegistry } from '../../core/mechanics/mechanicCompiler';
import { contingencyContractMechanicAdapter } from '../../data/mechanics/contingencyContractAdapter';
import { expandLegacyRecursiveSkillSequences } from './recursiveSequenceExpansion';
import { listSkillGroupDefinitionBindings } from '../../core/game-data/operatorSkillDefinitions';
import type { OperatorDefinition } from '../../core/game-data/operatorDefinition';

export function resolveLegacyRuntimeReplacementSkillKey(
  operator: OperatorDefinition,
  skillGroupKey: string,
  expectedSkillKey: string,
  actualSkillKey: string,
): string | null {
  const group = operator.skillGroups.find(candidate => candidate.key === skillGroupKey);
  const slot = operator.skillSlots?.find(candidate => candidate.key === skillGroupKey);
  if (
    group === undefined ||
    slot === undefined ||
    expectedSkillKey !== slot.baseSkillKey ||
    !slot.replacementSkillKeys.includes(actualSkillKey)
  ) {
    return null;
  }
  return listSkillGroupDefinitionBindings(group).some(
    binding => binding.skill.key === actualSkillKey,
  )
    ? actualSkillKey
    : null;
}

function createLegacyRuntimeReplacementResolver(
  repository: GameDataRepository,
): LegacyRuntimeReplacementResolver {
  return ({ scenario, trackIndex, skillGroupKey, expectedSkillKey, actualSkillKey }) => {
    const build = resolveScenarioBuilds(scenario, repository).find(
      candidate => candidate.trackIndex === trackIndex,
    );
    return build === undefined
      ? null
      : resolveLegacyRuntimeReplacementSkillKey(
          build.operator,
          skillGroupKey,
          expectedSkillKey,
          actualSkillKey,
        );
  };
}

interface LegacyResourceAdjustment {
  readonly path: string;
  readonly resource: 'ultimateEnergy';
  readonly from: number;
  readonly to: number;
  readonly reason: 'clampedToCurrentNativeMaximum';
}

type PreparedLegacySource = ReturnType<typeof prepareLegacySource>;

function conversionIssue(path: string, error: unknown) {
  return { path, message: error instanceof Error ? error.message : String(error) };
}

function replaceScenarioIndex(path: string, scenarioIndex: number): string {
  return path.replace(/^scenarioList\[0\]/, `scenarioList[${scenarioIndex}]`);
}

/** 单个损坏方案不能阻止同一文件里的其他方案转换。 */
function prepareLegacySourceBestEffort(
  input: unknown,
  mappings: ConversionMappings,
): PreparedLegacySource {
  try {
    return prepareLegacySource(input, mappings);
  } catch (completeError) {
    if (input === null || typeof input !== 'object' || Array.isArray(input)) throw completeError;
    const root = input as Record<string, unknown>;
    if (!Array.isArray(root.scenarioList) || root.scenarioList.length === 0) throw completeError;
    const preparedScenarios: { prepared: PreparedLegacySource; sourceIndex: number }[] = [];
    const omittedIssues = [] as { path: string; message: string }[];
    const seenIds = new Set<string>();
    root.scenarioList.forEach((scenario, scenarioIndex) => {
      const id =
        scenario !== null && typeof scenario === 'object' && !Array.isArray(scenario)
          ? (scenario as Record<string, unknown>).id
          : undefined;
      if (typeof id === 'string' && seenIds.has(id)) {
        omittedIssues.push({
          path: `scenarioList[${scenarioIndex}]`,
          message: `方案 ID ${id} 重复，已省略后出现的方案`,
        });
        return;
      }
      if (typeof id === 'string') seenIds.add(id);
      try {
        preparedScenarios.push({
          prepared: prepareLegacySource(
            { ...root, scenarioList: [scenario], activeScenarioId: id },
            mappings,
          ),
          sourceIndex: scenarioIndex,
        });
      } catch (error) {
        omittedIssues.push(conversionIssue(`scenarioList[${scenarioIndex}]`, error));
      }
    });
    if (preparedScenarios.length === 0) throw completeError;
    const first = preparedScenarios[0]!.prepared;
    const remap = <T extends { path: string }>(values: readonly T[], scenarioIndex: number) =>
      values.map(value => ({ ...value, path: replaceScenarioIndex(value.path, scenarioIndex) }));
    return {
      source: {
        ...(first.source as Record<string, unknown>),
        activeScenarioId: root.activeScenarioId,
        scenarioList: preparedScenarios.flatMap(({ prepared }) => prepared.source.scenarioList),
      },
      issues: [
        ...omittedIssues,
        ...preparedScenarios.flatMap(({ prepared, sourceIndex }) =>
          remap(prepared.issues, sourceIndex),
        ),
      ],
      times: preparedScenarios.flatMap(({ prepared, sourceIndex }) =>
        remap(prepared.times, sourceIndex),
      ),
      identityChanges: preparedScenarios.flatMap(({ prepared, sourceIndex }) =>
        remap(prepared.identityChanges, sourceIndex),
      ),
      ignoredCustomizations: preparedScenarios.flatMap(({ prepared, sourceIndex }) =>
        remap(prepared.ignoredCustomizations, sourceIndex),
      ),
      unresolvedSkills: preparedScenarios.flatMap(({ prepared, sourceIndex }) =>
        remap(prepared.unresolvedSkills, sourceIndex),
      ),
    };
  }
}

function normalizeInitialUltimateEnergy(
  project: EndaxisProjectDocument,
  repository: GameDataRepository,
) {
  const adjustments: LegacyResourceAdjustment[] = [];
  for (const [scenarioIndex, scenario] of project.scenarios.entries()) {
    const builds = resolveScenarioBuilds(scenario, repository);
    const maximums = new Map(
      builds.map(build => [
        build.track.id,
        resolveOperatorMaxUltimateEnergy(build.operator, build.operatorInstance),
      ]),
    );
    scenario.tracks.forEach((track, trackIndex) => {
      if (track === null) return;
      const maximum = track.initialState.maxUltimateEnergyOverride ?? maximums.get(track.id);
      if (maximum !== undefined && track.initialState.ultimateEnergy > maximum) {
        adjustments.push({
          path: `scenarioList[${scenarioIndex}].data.tracks[${trackIndex}].initialGauge`,
          resource: 'ultimateEnergy',
          from: track.initialState.ultimateEnergy,
          to: maximum,
          reason: 'clampedToCurrentNativeMaximum',
        });
        // 旧版运行时同样会在模拟开始时把存档初值钳到当时的槽上限。
        // 转换为当前原生上限并留下报告，不能让无效的存档原值阻塞整条轴。
        track.initialState.ultimateEnergy = maximum;
      }
    });
  }
  return adjustments;
}

/** 旧项目转换入口；可安全省略的内容写入报告，尽量返回仍可编辑的项目。 */
export function convertLegacyTimeline(
  input: unknown,
  repository: GameDataRepository,
  mappings: ConversionMappings = {},
  options: { readonly timingMode?: LegacyTimingMode } = {},
) {
  const prepared = prepareLegacySourceBestEffort(input, mappings);
  const result = createLegacyProjectImporter(repository).migrate(prepared.source);
  const mechanicAdapters = new MechanicAdapterRegistry([contingencyContractMechanicAdapter]);
  const simulation = new ScenarioSimulationService({
    index: repository,
    mechanicAdapters,
    elementalInflictionDocument: elementalAttachments,
    spellInflictionSettings: skillSettings,
    compoundStatusFactories,
    resources: {
      sharedSpGain: { baseGainEfficiency: skillSettingResources.atbGainEfficiency },
      spRecoveryPauseDuration: skillSettingResources.atbRecoverInterval,
      ultimateEnergySystemUnlocked: true,
      normalSkillUltimateEnergy: {
        selfGainPerSp: skillSettingResources.atbConsumedDefaultUspGainSelf,
        otherGainPerSp: skillSettingResources.atbConsumedDefaultUspGainOther,
      },
    },
  });
  const runSimulation = (
    scenario: EndaxisProjectDocument['scenarios'][number],
    endFrame: number,
  ) => {
    const session = simulation.createCombatSession(scenario, endFrame);
    session.advanceToFrame(endFrame);
    return session.collectResult();
  };
  const issues = [...prepared.issues];
  const fatalIssues: { path: string; message: string }[] = [];
  let project = result.ok ? result.value : null;
  let resourceAdjustments: LegacyResourceAdjustment[] = [];
  if (!result.ok) fatalIssues.push(...result.errors.map(message => ({ path: '', message })));
  else issues.push(...result.warnings.map(message => ({ path: '', message })));
  if (project !== null) {
    resourceAdjustments = normalizeInitialUltimateEnergy(project, repository);
    const checked = parseProjectDocument(project, { gameDataRepository: repository });
    if (!checked.ok) fatalIssues.push({ path: '', message: JSON.stringify(checked) });
  }
  let sequenceExpansion: ReturnType<typeof expandLegacyRecursiveSkillSequences> = {
    expansions: [],
    issues: [],
  };
  if (project !== null && fatalIssues.length === 0) {
    const beforeExpansion = structuredClone(project);
    try {
      sequenceExpansion = expandLegacyRecursiveSkillSequences(
        project,
        prepared.source,
        repository,
        runSimulation,
      );
    } catch (error) {
      project = beforeExpansion;
      issues.push(conversionIssue('', error));
    }
  }
  issues.push(...sequenceExpansion.issues);
  let retiming = {
    timingAdjustments: [],
    skillFormAdjustments: [],
    controlSwitchAdjustments: [],
    inferredControlSwitches: [],
    dodgeMarkerAdjustments: [],
    simulationStats: {
      scenarioCount: 0,
      castCount: 0,
      candidateProbes: 0,
      simulationRuns: 0,
    },
  } as ReturnType<typeof retimeLegacyProjectBySimulation>;
  if (project !== null && fatalIssues.length === 0) {
    const beforeRetiming = structuredClone(project);
    try {
      retiming = retimeLegacyProjectBySimulation(
        project,
        prepared.source,
        runSimulation,
        createLegacyRuntimeReplacementResolver(repository),
        {
          compileInputs: scenario => simulation.compileFixedInputs(scenario),
          createSession: (scenario, frame) =>
            new CheckpointRetimingSession(simulation.createInputCombatSession(scenario, frame)),
        },
        options.timingMode,
      );
    } catch (error) {
      project = beforeRetiming;
      issues.push({
        path: '',
        message: `${options.timingMode === 'preserve' ? '保留时间的形态判断失败' : '智能调整时间失败'}，已保留直接转换的位置：${conversionIssue('', error).message}`,
      });
    }
  }
  if (project !== null && fatalIssues.length === 0) {
    const checked = parseProjectDocument(project, { gameDataRepository: repository });
    if (!checked.ok) fatalIssues.push({ path: '', message: JSON.stringify(checked) });
  }
  return {
    status:
      project === null || fatalIssues.length > 0
        ? 'blocked'
        : issues.length > 0
          ? 'converted-with-issues'
          : 'converted',
    project: fatalIssues.length === 0 ? project : null,
    report: {
      timingMode: options.timingMode ?? 'repair',
      issues,
      simulationIssues: issues.filter(issue => issue.impact !== 'presentation'),
      presentationIssues: issues.filter(issue => issue.impact === 'presentation'),
      fatalIssues,
      times: prepared.times,
      identityChanges: prepared.identityChanges,
      ignoredCustomizations: prepared.ignoredCustomizations,
      unresolvedSkills: prepared.unresolvedSkills,
      sequenceExpansions: sequenceExpansion.expansions,
      resourceAdjustments,
      timingAdjustments: retiming.timingAdjustments,
      skillFormAdjustments: retiming.skillFormAdjustments,
      controlSwitchAdjustments: retiming.controlSwitchAdjustments,
      inferredControlSwitches: retiming.inferredControlSwitches,
      dodgeMarkerAdjustments: retiming.dodgeMarkerAdjustments,
      retimingSimulationStats: retiming.simulationStats,
      sourceActionCounts: prepared.source.scenarioList.map((s: any) => ({
        id: s.id,
        count: s.data.tracks.reduce((n: number, t: any) => n + t.actions.length, 0),
      })),
      limitations: [
        options.timingMode === 'preserve'
          ? '保留旧轴技能位置（换算为新版帧率），不修复重叠或不可接续；仍判断技能形态并补主控切换'
          : '按旧版全局技能顺序，使用新版逐步模拟的开始、结束、允许接续窗口和终结技时间膨胀区间修正放置帧',
        '旧轴默认第1轨道为主控，并在其他干员的普攻、强化普攻、下落攻击或处决开始时补主控切换标记',
        '标准旧闪避块转换为同轨普通向前闪避标签；旧格式没有方向或极限闪避成功事实，因此不补成功收益',
        '使用当前游戏定义重算；旧 hits、Buff、面板、伤害等快照不迁移',
        '连接只支持可唯一对应技能块的 action-to-action 端点；未实现旧自定义行为、派生端点、继承状态、合约及非中性全局修正',
      ],
    },
  };
}
