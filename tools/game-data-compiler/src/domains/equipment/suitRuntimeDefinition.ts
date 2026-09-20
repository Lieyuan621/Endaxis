import type { GameplayTagRegistry } from '../../source/nativeGameplayTags.ts';
import { requireRecord } from '../../source/primitives.ts';
import { parseBuffRuntimeSource } from '../../source/buffRuntime.ts';
import type { CompiledBuffDefinitionSource } from '../../compiler/buffs/buffProjectionTypes.ts';
import type {
  CompiledBuffSequenceSource,
  CompiledBuffStepSource,
} from '../../compiler/actions/combatActionProjectionTypes.ts';
import {
  buffRuntimeReadsBlackboardKey,
  collectBuffRuntimePresentationActionPaths,
  collectBuffRuntimeClosure,
  compileBuffRuntimeDefinitionSource,
  isAfterEnemyDefeatedOnlyBuffRuntime,
  isPresentationOnlyBuffStackEffect,
} from '../../compiler/buffs/buffRuntimeProjection.ts';
import type {
  CompiledGearSetStaticDefinitionSource,
  CompiledGearSetRuntimeDependencySource,
  CompiledGearSetToggleBuffGroupSource,
  UnresolvedSkillBlackboardValueSource,
} from './suitStaticDefinition.ts';
import type { EquipmentDefinitionDiagnosticSource } from './formalDefinition.ts';
import { standardStumpBuffAbilityEventOmissionReason } from '../../compiler/scenario/standardStumpScenarioPolicy.ts';

export interface CompiledEquipmentSuitRuntimeBatchSource {
  readonly definitions: readonly (CompiledGearSetStaticDefinitionSource & {
    readonly buffDefinitions?: Readonly<Record<string, CompiledBuffDefinitionSource>>;
    readonly enableSequence?: CompiledBuffSequenceSource;
    readonly initializationSequence?: CompiledBuffSequenceSource;
  })[];
  readonly diagnostics: readonly EquipmentDefinitionDiagnosticSource[];
}

/**
 * 将套装静态候选的根 Buff 闭包投影为正式 Next Buff 资源和帧 0 安装动作。
 * 当前公共动作 IR 只完整表达技能类型守卫与 CreateBuff；任何其他非表现行为都会阻塞该套装。
 */
export function compileEquipmentSuitRuntimeBatchSource(
  definitions: readonly CompiledGearSetStaticDefinitionSource[],
  // 来源计划的消费视图；兼容旧调用省略 startupBuffs，不复制安装参数字段。
  dependencies: readonly (Pick<
    CompiledGearSetRuntimeDependencySource,
    'suitId' | 'skillId' | 'startupBuffIds' | 'toggleBuffIds' | 'toggleBuffs'
  > &
    Partial<Pick<CompiledGearSetRuntimeDependencySource, 'startupBuffs'>>)[],
  buffDataValue: unknown,
  gameplayTagRegistry?: GameplayTagRegistry,
): CompiledEquipmentSuitRuntimeBatchSource {
  const buffData = requireRecord(buffDataValue, 'BuffData');
  const dependenciesBySuit = new Map(dependencies.map(item => [item.suitId, item]));
  const diagnostics: EquipmentDefinitionDiagnosticSource[] = [];
  const output: CompiledEquipmentSuitRuntimeBatchSource['definitions'][number][] = [];

  for (const definition of definitions) {
    const dependency = dependenciesBySuit.get(definition.slug);
    if (dependency === undefined) {
      diagnostics.push({
        status: 'blocked',
        sourcePath: `EquipSuitTable.${definition.slug}`,
        reason: 'missing compiled suit runtime dependency',
      });
      continue;
    }
    const activeToggleInstallations: CompiledGearSetToggleBuffGroupSource['buffs'][number][] = [];
    let toggleBlocked = false;
    for (const [groupIndex, group] of dependency.toggleBuffs.entries()) {
      const conditionResults = group.conditions.map(condition =>
        evaluateFixedFullHealthToggleCondition(condition),
      );
      if (conditionResults.some(result => result === null)) {
        toggleBlocked = true;
        diagnostics.push({
          status: 'blocked',
          sourcePath: `SkillData.${dependency.skillId}.toggleBuffs[${groupIndex}]`,
          reason: 'toggle Buff condition requires an unmaterialized server passive skill value',
        });
        continue;
      }
      if (conditionResults.some(result => result === false)) {
        diagnostics.push({
          status: 'scenario-omitted',
          sourcePath: `SkillData.${dependency.skillId}.toggleBuffs[${groupIndex}]`,
          reason: 'toggle Buff condition is false at fixed full health',
        });
        continue;
      }
      for (const installation of group.buffs) {
        const raw = buffData[installation.buffId];
        if (raw === undefined)
          throw new Error(`BuffData: missing toggle Buff ${JSON.stringify(installation.buffId)}`);
        const source = parseBuffRuntimeSource(raw, `BuffData.${installation.buffId}`);
        if (isAfterEnemyDefeatedOnlyBuffRuntime(source)) {
          diagnostics.push({
            status: 'scenario-omitted',
            sourcePath: `BuffData.${installation.buffId}.abilityEventAction`,
            reason:
              'enemy-defeated response occurs after the fixed single target simulation has ended',
          });
          continue;
        }
        activeToggleInstallations.push(installation);
      }
    }
    if (toggleBlocked) continue;
    const startupInstallations =
      dependency.startupBuffs ??
      dependency.startupBuffIds.map(buffId => ({ buffId, blackboardAssignments: {} }));
    const installations = [...startupInstallations, ...activeToggleInstallations];
    if (installations.length === 0) {
      output.push(definition);
      continue;
    }

    const sources = collectBuffRuntimeClosure(
      installations.map(installation => installation.buffId),
      buffData,
    );
    const visualOnlyIds = new Set(
      [...sources.entries()]
        .filter(([, source]) => isPresentationOnlyBuffStackEffect(source))
        .map(([id]) => id),
    );
    for (const id of visualOnlyIds) {
      diagnostics.push({
        status: 'scenario-omitted',
        sourcePath: `BuffData.${id}.stackingSettings.stackEffects`,
        reason: 'particle-only stack effect does not affect the fixed-target damage simulation',
      });
    }

    const buffDefinitions: Record<string, CompiledBuffDefinitionSource> = {};
    let blocked = false;
    for (const [buffId, source] of sources) {
      if (visualOnlyIds.has(buffId)) continue;
      for (const sourcePath of collectBuffRuntimePresentationActionPaths(source)) {
        diagnostics.push({
          status: 'scenario-omitted',
          sourcePath,
          reason:
            'strictly validated presentation action has no effect in the non-rendering combat backend',
        });
      }
      const omittedAbilityEvents = new Set<string | number>();
      for (const event of source.graph.abilityEvents) {
        const reason = standardStumpBuffAbilityEventOmissionReason(event.event);
        if (reason === null) continue;
        omittedAbilityEvents.add(event.event);
        diagnostics.push({
          status: 'scenario-omitted',
          sourcePath: `BuffData.${buffId}.abilityEventAction`,
          reason,
        });
      }
      try {
        buffDefinitions[buffId] = compileBuffRuntimeDefinitionSource(
          source,
          visualOnlyIds,
          omittedAbilityEvents,
          {},
          undefined,
          { gameplayTagRegistry },
        );
      } catch (error) {
        blocked = true;
        diagnostics.push({
          status: 'blocked',
          sourcePath: `BuffData.${buffId}`,
          reason: error instanceof Error ? error.message : String(error),
        });
      }
    }
    if (blocked) continue;
    const initializationSteps: CompiledBuffStepSource[] = [];
    const enableSteps: CompiledBuffStepSource[] = [];
    for (const [installationIndex, installation] of installations.entries()) {
      if (visualOnlyIds.has(installation.buffId)) continue;
      const rootSource = sources.get(installation.buffId);
      if (rootSource === undefined) {
        blocked = true;
        diagnostics.push({
          status: 'blocked',
          sourcePath: `BuffData.${installation.buffId}`,
          reason: 'startup Buff is missing from the compiled runtime closure',
        });
        continue;
      }
      const assignments: Record<string, { readonly kind: 'constant'; readonly value: number }> = {};
      for (const [targetKey, value] of Object.entries(installation.blackboardAssignments)) {
        if (isUnresolvedSkillBlackboardValue(value)) {
          if (buffRuntimeReadsBlackboardKey(rootSource, targetKey)) {
            blocked = true;
            diagnostics.push({
              status: 'blocked',
              sourcePath: `SkillData.${dependency.skillId}.buffs.${installation.buffId}.${targetKey}`,
              reason: `server passive skill blackboard value ${JSON.stringify(value.key)} is required by the installed Buff`,
            });
          } else {
            diagnostics.push({
              status: 'scenario-omitted',
              sourcePath: `SkillData.${dependency.skillId}.buffs.${installation.buffId}.${targetKey}`,
              reason: `unmaterialized server passive skill blackboard value ${JSON.stringify(value.key)} is never read by the installed Buff`,
            });
          }
          continue;
        }
        if (typeof value !== 'number') {
          blocked = true;
          diagnostics.push({
            status: 'blocked',
            sourcePath: `SkillData.${dependency.skillId}.buffs.${installation.buffId}.${targetKey}`,
            reason:
              'direct string Buff assignment is not supported by the generated action contract',
          });
          continue;
        }
        assignments[targetKey] = { kind: 'constant', value };
      }
      const steps =
        installationIndex < startupInstallations.length ? enableSteps : initializationSteps;
      steps.push({
        kind: 'applyBuff',
        parameters: {
          buffId: installation.buffId,
          target: 'caster',
          ...(Object.keys(assignments).length === 0 ? {} : { blackboardAssignments: assignments }),
        },
      });
    }
    if (blocked) continue;
    output.push({
      ...definition,
      buffDefinitions: Object.fromEntries(
        Object.entries(buffDefinitions).sort(([left], [right]) => left.localeCompare(right)),
      ),
      ...(enableSteps.length === 0 ? {} : { enableSequence: { steps: enableSteps } }),
      ...(initializationSteps.length === 0
        ? {}
        : { initializationSequence: { steps: initializationSteps } }),
    });
  }
  return { definitions: output, diagnostics };
}

export function evaluateFixedFullHealthToggleCondition(
  condition: CompiledGearSetToggleBuffGroupSource['conditions'][number],
): boolean | null {
  if (isUnresolvedSkillBlackboardValue(condition.value)) return null;
  const currentHpRatio = 1;
  switch (condition.comparison) {
    case 'GE':
      return currentHpRatio >= condition.value;
    case 'GT':
      return currentHpRatio > condition.value;
    case 'LE':
      return currentHpRatio <= condition.value;
    case 'LT':
      return currentHpRatio < condition.value;
    case 'EQ':
      return currentHpRatio === condition.value;
    case 'NE':
      return currentHpRatio !== condition.value;
    default:
      throw new Error(
        `unsupported current HP ratio comparison ${JSON.stringify(condition.comparison)}`,
      );
  }
}

function isUnresolvedSkillBlackboardValue(
  value: number | string | UnresolvedSkillBlackboardValueSource,
): value is UnresolvedSkillBlackboardValueSource {
  return typeof value === 'object' && value.kind === 'unresolvedSkillBlackboard';
}

/** Whether any executable/lifecycle field consumes a value from this Buff's local blackboard. */
