/**
 * 在启动模拟前检查编译产物是否完全落在标准玩家生命伤害环境的能力边界内。
 * 本模块只报告结构化问题，不读取运行时状态；环境扩展能力时应先更新这里，再接入执行器。
 */
import type {
  CompiledSkillProgram,
  ResolvedActionSequence,
  ResolvedSkillBuffDefinition,
} from '../../compiler/combatProgram';
import type { CombatCondition } from '../../game-data/operatorDefinition';
import type { ScheduledSkillInput } from '../state/environmentState';
import type { CombatOperatorProgram } from './combatRuntimeAssembly';
import { inspectKnockDownControlConsumers } from './knockDownControlCompatibility';

export const STANDARD_PLAYER_DAMAGE_COMPATIBILITY_CODES = [
  'unsupported-step',
  'unsupported-condition',
  'unsupported-damage-calculation',
  'unsupported-damage-field',
  'unsupported-resource-change',
] as const;

/** 标准伤害预检问题的稳定分类；UI 可以凭它自行翻译。 */
export type StandardPlayerDamageCompatibilityCode =
  (typeof STANDARD_PLAYER_DAMAGE_COMPATIBILITY_CODES)[number];

/** 一项问题同时保留机器可读分类和可定位到编译产物的路径。 */
export interface StandardPlayerDamageCompatibilityIssue {
  readonly code: StandardPlayerDamageCompatibilityCode;
  readonly path: string;
  readonly detail: string;
}

/** 预检只扫描本次模拟实际可能触发的技能，同时检查全局装配缺口。 */
export interface StandardPlayerDamageCompatibilityInput {
  readonly operators: readonly CombatOperatorProgram[];
  readonly inputs?: readonly ScheduledSkillInput[];
  readonly endFrame: number;
  /** 未提供元素附着定义时，`applyElementalInfliction` 仍视为不支持步骤。 */
  readonly supportsElementalInfliction?: boolean;
  /** 仅由已装配实体控制时钟、预定义标签与显式到期策略的环境开启。 */
  readonly supportsKnockDown?: boolean;
}

/** 预检失败时一次携带全部问题，避免逐个修复后才发现下一项。 */
export class StandardPlayerDamageCompatibilityError extends Error {
  constructor(readonly issues: readonly StandardPlayerDamageCompatibilityIssue[]) {
    super(
      [
        `standard player damage profile is incompatible with ${issues.length} compiled operation(s):`,
        ...issues.map(issue => `${issue.path}: ${issue.detail}`),
      ].join('\n'),
    );
    this.name = 'StandardPlayerDamageCompatibilityError';
  }
}

type IssueCollector = (issue: StandardPlayerDamageCompatibilityIssue) => void;

interface CompatibilityFlags {
  readonly elementalInfliction: boolean;
  readonly operatorVitals: boolean;
  readonly knockDown: boolean;
  readonly buffDefinitions?: CombatOperatorProgram['buffDefinitions'];
  readonly inspectedBuffs: Set<ResolvedSkillBuffDefinition>;
}

function report(
  collect: IssueCollector,
  code: StandardPlayerDamageCompatibilityCode,
  path: string,
  detail: string,
): void {
  collect(Object.freeze({ code, path, detail }));
}

function inspectCondition(
  condition: CombatCondition,
  path: string,
  collect: IssueCollector,
  flags: CompatibilityFlags,
): void {
  switch (condition.kind) {
    case 'constant':
    case 'combatActive':
    case 'singleEnemyPresent':
    case 'actionValueCompare':
    case 'deckAttributeCompare':
    case 'probability':
    case 'contextTargetCountCompare':
    case 'contextTargetObjectTypeMatch':
    case 'actionInputTargetObjectTypeMatch':
    case 'actionInputTargetIdentityMatch':
    case 'contextTargetIdentityMatch':
    case 'contextTargetEntityTagMatch':
    case 'contextTargetBuffStackCompare':
    case 'contextTargetBuffIdStackCompare':
    case 'abilityEntityRemainingDurationCompare':
    case 'ownerSpawnedAbilityEntityPresent':
    case 'timedMarkerPresent':
    case 'globalCooldownPresent':
    case 'casterComboPending':
    case 'eventComboRingQteSucceeded':
    case 'abilityEntityTimedMarkerPresent':
    case 'elementalReactionActive':
    case 'casterControlled':
    case 'characterTypeIn':
    case 'operatorRoleIn':
    case 'enemyRankIn':
    case 'enemySuperArmorCompare':
    case 'cameraToTargetAngleCompare':
    case 'poiseCompare':
    case 'targetStaggered':
    case 'eventSourceMatchesBuffSource':
    case 'eventSourceMatchesBuffSourceEntitySource':
    case 'eventSourceControlled':
    case 'buffSourceMatchesOwner':
    case 'eventDamageTagsMatch':
    case 'eventDamageGameplayTagsMatch':
    case 'eventDamageFeaturesMatch':
    case 'eventDamageTypeIn':
    case 'eventHealTagsMatch':
    case 'eventSourceTargetMatch':
    case 'eventInflictionElementIn':
    case 'eventPhysicalInflictionTypeIn':
    case 'eventCustomAbilityNameMatch':
    case 'eventSkillTypeIn':
    case 'originSkillTypeIn':
    case 'contextTargetContains':
    case 'eventSkillIdIn':
    case 'eventSkillCastMatchesBuffSource':
    case 'eventBuffIdMatch':
    case 'eventBuffTagsMatch':
    case 'eventTargetBuffCountCompare':
    case 'eventSpGainMatch':
    case 'eventConsumedBuffLayerCompare':
    case 'eventActionOwnerTargetMatch':
    case 'eventOverheal':
    case 'eventBuffEndedEarly':
    case 'buffStackCompare':
    case 'buffTagIdCountCompare':
    case 'currentBuffStackCompare':
    case 'buffIdStackCompare':
    case 'buffBlackboardValueCompare':
    case 'entityTagMatch':
      return;
    case 'healthCompare':
      if (condition.target !== 'enemy' && !flags.operatorVitals) {
        report(
          collect,
          'unsupported-condition',
          path,
          `healthCompare for '${condition.target}' requires operator vitals`,
        );
      }
      return;
    case 'not':
      inspectCondition(condition.condition, `${path}.condition`, collect, flags);
      return;
    case 'all':
    case 'any':
      condition.conditions.forEach((child, index) =>
        inspectCondition(child, `${path}.conditions[${index}]`, collect, flags),
      );
      return;
    default:
      report(collect, 'unsupported-condition', path, `condition '${condition.kind}'`);
  }
}

function inspectSequence(
  sequence: ResolvedActionSequence,
  path: string,
  collect: IssueCollector,
  flags: CompatibilityFlags,
  source: 'skill' | 'equipment' = 'skill',
): void {
  sequence.steps.forEach((step, index) => {
    const stepPath = `${path}.steps[${index}]`;
    switch (step.kind) {
      case 'mergeContextTargets':
      case 'findCharacterTeamTargets':
      case 'createSpatialPointTargets':
      case 'findOwnerSpawnedAbilityEntities':
      case 'readAbilityEntityRemainingDuration':
      case 'setAbilityEntityRemainingDuration':
      case 'finishCurrentAbilityEntity':
      case 'finishCurrentAbilityEntityWhenSourceDies':
      case 'startCurrentAbilityEntityChildSkill':
      case 'startCurrentAbilityEntityChildSkillById':
        return;
      case 'dealDamage': {
        const parameters = step.parameters;
        if (parameters.damageType === 'lifeDrain') {
          report(
            collect,
            'unsupported-damage-calculation',
            `${stepPath}.parameters.damageType`,
            "damage type 'lifeDrain' uses a separate native calculation",
          );
        }
        if (parameters.attackScalePerStatusStack !== undefined) {
          report(
            collect,
            'unsupported-damage-field',
            `${stepPath}.parameters.attackScalePerStatusStack`,
            'status-scaled attack requires a status-aware damage resolver',
          );
        }
        return;
      }
      case 'dealFixedDamage':
        if (step.parameters.damageType === 'lifeDrain') {
          report(
            collect,
            'unsupported-damage-calculation',
            `${stepPath}.parameters.damageType`,
            "damage type 'lifeDrain' uses a separate native calculation",
          );
        }
        return;
      case 'heal':
        if (!flags.operatorVitals) {
          report(
            collect,
            'unsupported-step',
            stepPath,
            `heal target '${step.parameters.target}' requires an operator vitals selection path`,
          );
        }
        return;
      case 'applyElementalInfliction':
        if (source === 'equipment') {
          report(
            collect,
            'unsupported-step',
            stepPath,
            'equipment-triggered infliction requires a recovered source-classification path',
          );
          return;
        }
        if (!flags.elementalInfliction) {
          report(
            collect,
            'unsupported-step',
            stepPath,
            'elemental infliction requires an elemental infliction document',
          );
        }
        return;
      case 'triggerSpellBurst':
        if (!flags.elementalInfliction) {
          report(
            collect,
            'unsupported-step',
            stepPath,
            'spell burst requires elemental Buff definitions and SkillSetting data',
          );
        }
        return;
      case 'triggerCustomAbilityEvent':
      case 'castSkillDuringAction':
        return;
      case 'applyPhysicalInfliction':
        if (source === 'equipment') {
          report(
            collect,
            'unsupported-step',
            stepPath,
            'equipment-triggered physical infliction requires a recovered source-classification path',
          );
          return;
        }
        inspectBuffDefinition(
          step.parameters.noGuardDefinition,
          `${stepPath}.parameters.noGuardDefinition`,
          collect,
          flags,
          source,
        );
        if (step.parameters.type === 'crush') {
          inspectBuffDefinition(
            step.parameters.crushedDefinition,
            `${stepPath}.parameters.crushedDefinition`,
            collect,
            flags,
            source,
          );
        } else if (step.parameters.type === 'fracture') {
          inspectBuffDefinition(
            step.parameters.fractureDefinition,
            `${stepPath}.parameters.fractureDefinition`,
            collect,
            flags,
            source,
          );
        } else {
          inspectBuffDefinition(
            step.parameters.airborneDefinition,
            `${stepPath}.parameters.airborneDefinition`,
            collect,
            flags,
            source,
          );
        }
        return;
      case 'applyKnockDown':
        if (!flags.knockDown || source === 'equipment') {
          report(
            collect,
            'unsupported-step',
            stepPath,
            'root knock-down requires audited standard-scene control-consumer bindings',
          );
          return;
        }
        if (step.parameters.isExtra) {
          report(
            collect,
            'unsupported-step',
            stepPath,
            'extra knock-down requires BuffAddContext support',
          );
        }
        if (!flags.operatorVitals) {
          report(
            collect,
            'unsupported-step',
            stepPath,
            'knock-down source requires a resolved operator attribute panel',
          );
        }
        if (step.parameters.targetFilter === 'skipAll') return;
        for (const id of [
          'buff_physical_knockdown',
          ...(step.parameters.force ? [] : ['buff_physical_no_guard']),
        ]) {
          const definition = flags.buffDefinitions?.[id];
          if (definition === undefined) {
            report(
              collect,
              'unsupported-step',
              stepPath,
              `knock-down requires Buff definition '${id}'`,
            );
          } else {
            // 隐式创建的物理状态 Buff 及其后代/事件也是执行程序；只沿实际根闭包预检，
            // 不能因为目录共享而把完全无关的公共 Buff 当作本次击倒会执行。
            inspectBuffDefinition(
              definition,
              `${stepPath}.buffDefinitions['${id}']`,
              collect,
              flags,
              source,
            );
          }
        }
        return;
      case 'applyElementalReaction':
      case 'consumeElementalReaction':
      case 'outputAirborne':
      case 'outputKnockDown':
        return;
      case 'applyBuff':
        if (step.parameters.definition !== undefined) {
          inspectBuffDefinition(
            step.parameters.definition,
            `${stepPath}.parameters.definition`,
            collect,
            flags,
            source,
          );
        }
        return;
      case 'createGlobalBuff':
      case 'inheritBuffById':
      case 'readBuffBlackboard':
      case 'readEventBuffBlackboard':
      case 'readCurrentBuffRemainingDuration':
      case 'setCurrentBuffRemainingDuration':
      case 'readBuffStackCount':
      case 'finishBuffsByTag':
      case 'finishBuffsById':
      case 'finishCurrentBuff':
      case 'skillAffix':
      case 'setCurrentBuffTimePaused':
      case 'igniteBuffs':
      case 'holdBuffsById':
        return;
      case 'dealStagger':
      case 'spawnAbilityEntity':
      case 'storeCurrentTimelineFrame':
      case 'storeEventSpGainAmount':
      case 'modifyActionValue':
      case 'calculateActionValue':
      case 'createTimedMarker':
      case 'setGlobalCooldown':
      case 'createAbilityEntityTimedMarker':
      case 'gainSquadUltimateEnergyFromSkillCost':
      case 'gainFinisherSp':
      case 'restrictUltimateEnergyRecovery':
      case 'openComboWindow':
      case 'showComboRingQte':
      case 'changeSkillSlot':
      case 'overrideBasicAttackMapping':
      case 'overrideMultiDashLimit':
      case 'changePlayerActionMode':
      case 'changeNativeSkillType':
      case 'adjustSkillCooldown':
      case 'startTimeDilation':
      case 'startUltimateTimeDilation':
      case 'hideUi':
      case 'launchProjectileLifetime':
      case 'setIgnoreGlobalTimeScale':
        return;
      case 'listenForCombatEvents':
        step.parameters.responses.forEach((response, index) => {
          if (response.condition !== undefined) {
            inspectCondition(
              response.condition,
              `${stepPath}.parameters.responses[${index}].condition`,
              collect,
              flags,
            );
          }
          inspectSequence(
            response.sequence,
            `${stepPath}.parameters.responses[${index}].sequence`,
            collect,
            flags,
            source,
          );
        });
        return;
      case 'storeSourceAttributeValue':
        if (!flags.operatorVitals) {
          report(
            collect,
            'unsupported-step',
            stepPath,
            'storeSourceAttributeValue requires a resolved operator panel',
          );
        }
        return;
      case 'storeEntityPropertyValue':
        // 标准战斗环境始终为当前敌人和已编队干员建立生命/失衡账本。
        return;
      case 'storeEventHealValues':
      case 'storeShieldValue':
        return;
      case 'setHealthFloor':
        return;
      case 'readSkillSettingData':
        // 数值表已在生成阶段内嵌；仅强化计算需要运行面板，不再次依赖原始配置文件。
        if (
          step.parameters.items.some(item => item.enhance !== undefined) &&
          !flags.operatorVitals
        ) {
          report(
            collect,
            'unsupported-step',
            stepPath,
            'enhanced readSkillSettingData requires a resolved operator panel',
          );
        }
        return;
      case 'jumpTimeline':
        if (step.parameters.condition !== undefined) {
          inspectCondition(
            step.parameters.condition,
            `${stepPath}.parameters.condition`,
            collect,
            flags,
          );
        }
        return;
      case 'finishTimeline':
      case 'reachSkillOperableBoundary':
      case 'markCurrentSkillCanDash':
        return;
      case 'scheduleProjectileFinishCallback':
        step.callback.timelineActions.forEach((action, index) =>
          inspectSequence(
            action.sequence,
            `${stepPath}.callback.timelineActions[${index}].sequence`,
            collect,
            flags,
            source,
          ),
        );
        return;
      case 'changeResource':
      case 'changeResourceByActionValue': {
        const { resource, recipient } = step.parameters;
        const supported =
          (resource === 'sp' && recipient === 'team') ||
          (resource === 'ultimateEnergy' && recipient === 'caster');
        if (!supported) {
          report(
            collect,
            'unsupported-resource-change',
            `${stepPath}.parameters`,
            `resource '${resource}' for recipient '${recipient}'`,
          );
        }
        return;
      }
      case 'switch':
        step.options.forEach((option, index) =>
          inspectSequence(
            option.sequence,
            `${stepPath}.options[${index}].sequence`,
            collect,
            flags,
            source,
          ),
        );
        return;
      case 'conditional':
        inspectCondition(
          step.parameters.condition,
          `${stepPath}.parameters.condition`,
          collect,
          flags,
        );
        inspectSequence(step.whenTrue, `${stepPath}.whenTrue`, collect, flags, source);
        if (step.whenFalse !== undefined) {
          inspectSequence(step.whenFalse, `${stepPath}.whenFalse`, collect, flags, source);
        }
        return;
      case 'once':
      case 'withActionBlackboardScope':
      case 'repeatEachTick':
      case 'repeatByActionValue':
        inspectSequence(step.body, `${stepPath}.body`, collect, flags, source);
        return;
      case 'forEachContextTarget':
        inspectSequence(step.body, `${stepPath}.body`, collect, flags, source);
        return;
      case 'pickContextTarget':
        // 只在已编译的命名目标组中取一个运行时引用；本身不改变伤害计算协议。
        return;
      default:
        report(collect, 'unsupported-step', stepPath, `step '${step.kind}'`);
    }
  });
}

/** 内联 Buff 会在施加后创建自己的时间线、生命周期和事件响应，必须一起预检。 */
function inspectBuffDefinition(
  definition: ResolvedSkillBuffDefinition,
  path: string,
  collect: IssueCollector,
  flags: CompatibilityFlags,
  source: 'skill' | 'equipment',
): void {
  if (flags.inspectedBuffs.has(definition)) return;
  flags.inspectedBuffs.add(definition);
  definition.scheduledSequences?.forEach((scheduled, index) =>
    inspectSequence(
      scheduled.sequence,
      `${path}.scheduledSequences[${index}].sequence`,
      collect,
      flags,
      source,
    ),
  );
  Object.entries(definition.lifecycleSequences ?? {}).forEach(([key, sequence]) => {
    if (sequence !== undefined) {
      inspectSequence(sequence, `${path}.lifecycleSequences.${key}`, collect, flags, source);
    }
  });
  definition.abilityEventResponses?.forEach((response, index) =>
    inspectSequence(
      response.sequence,
      `${path}.abilityEventResponses[${index}].sequence`,
      collect,
      flags,
      source,
    ),
  );
  definition.igniteEventResponses?.forEach((response, index) =>
    inspectSequence(
      response.sequence,
      `${path}.igniteEventResponses[${index}].sequence`,
      collect,
      flags,
      source,
    ),
  );
  definition.damageModifiers?.forEach((modifier, index) => {
    if (modifier.conditionProgram !== undefined) {
      inspectSequence(
        modifier.conditionProgram,
        `${path}.damageModifiers[${index}].conditionProgram`,
        collect,
        flags,
        source,
      );
    }
  });
}

function inspectProgram(
  program: CompiledSkillProgram,
  scheduledFrames: readonly number[],
  endFrame: number,
  operatorPath: string,
  collect: IssueCollector,
  flags: CompatibilityFlags,
): void {
  const programPath = `${operatorPath}.skills['${program.skillId}']`;
  program.timelineActions.forEach((action, index) => {
    if (!scheduledFrames.some(castFrame => castFrame + action.startFrame <= endFrame)) return;
    inspectSequence(
      action.sequence,
      `${programPath}.timelineActions[${index}].sequence`,
      collect,
      flags,
    );
  });
}

/**
 * 检查完整干员编译结果，包括尚未安装进标准入口的装备事件监听器。
 * 返回顺序与干员、技能、时间动作和步骤的声明顺序一致，便于稳定测试与展示。
 */
export function inspectStandardPlayerDamageCompatibility(
  input: StandardPlayerDamageCompatibilityInput,
): readonly StandardPlayerDamageCompatibilityIssue[] {
  if (!Number.isInteger(input.endFrame) || input.endFrame < 0) {
    throw new RangeError('endFrame must be a non-negative integer');
  }
  const issues: StandardPlayerDamageCompatibilityIssue[] = [];
  const collect: IssueCollector = issue => issues.push(issue);
  const flags: CompatibilityFlags = {
    elementalInfliction: input.supportsElementalInfliction ?? false,
    operatorVitals: false,
    knockDown: input.supportsKnockDown ?? false,
    inspectedBuffs: new Set(),
  };
  if (flags.knockDown) {
    for (const issue of inspectKnockDownControlConsumers(input.operators))
      report(collect, 'unsupported-condition', issue.path, issue.detail);
  }
  input.operators.forEach((operator, operatorIndex) => {
    const operatorPath = `operators[${operatorIndex}]('${operator.operatorId}')`;
    const operatorFlags: CompatibilityFlags = {
      ...flags,
      operatorVitals: operator.panel !== undefined,
      buffDefinitions: operator.buffDefinitions,
      inspectedBuffs: new Set(),
    };
    const definitions = new Map(
      [...(operator.definitionSkillPrograms ?? []), ...operator.skills].map(program => [
        program.skillId,
        program,
      ]),
    );
    const casts = new Map(
      (operator.skillCasts ?? []).map(binding => [binding.castId, binding.program]),
    );
    const scheduledPrograms = new Map<CompiledSkillProgram, number[]>();
    for (const scheduled of input.inputs ?? []) {
      if (scheduled.operatorId !== operator.operatorId || scheduled.frame > input.endFrame)
        continue;
      const program =
        (scheduled.castId === undefined ? undefined : casts.get(scheduled.castId)) ??
        definitions.get(scheduled.skillId);
      if (program === undefined) continue;
      const frames = scheduledPrograms.get(program) ?? [];
      frames.push(scheduled.frame);
      scheduledPrograms.set(program, frames);
    }
    scheduledPrograms.forEach((skillScheduledFrames, program) => {
      inspectProgram(
        program,
        skillScheduledFrames,
        input.endFrame,
        operatorPath,
        collect,
        operatorFlags,
      );
    });
    operator.equipmentContributions?.forEach((contribution, contributionIndex) => {
      contribution.eventHandlers.forEach((handler, handlerIndex) => {
        const handlerPath = `${operatorPath}.equipmentContributions[${contributionIndex}].eventHandlers[${handlerIndex}]`;
        if (handler.condition !== undefined) {
          inspectCondition(handler.condition, `${handlerPath}.condition`, collect, operatorFlags);
        }
        inspectSequence(
          handler.sequence,
          `${handlerPath}.sequence`,
          collect,
          operatorFlags,
          'equipment',
        );
      });
    });
  });

  return Object.freeze(issues);
}

/** 在任何运行时对象推进前拒绝不完整的标准伤害模拟。 */
export function assertStandardPlayerDamageCompatibility(
  input: StandardPlayerDamageCompatibilityInput,
): void {
  const issues = inspectStandardPlayerDamageCompatibility(input);
  if (issues.length > 0) throw new StandardPlayerDamageCompatibilityError(issues);
}
