/**
 * 单个技能从等级化定义进入运行时程序的编译边界。
 * 调用前必须给出有效等级；调用后所有数值均已解析，运行时不得再访问养成配置。
 */
import type {
  ActionValueOperand,
  ActionSequenceDefinition,
  CombatStepDefinition,
  LevelValues,
  SkillDefinition,
  SkillActionProgramDefinition,
  SkillBuffDefinition,
  SkillType,
  StatusModifierDefinition,
  AbilityEntityChildSkillDefinition,
  AbilityEntityDefinition,
  OperatorAbilityEntityDefinitions,
} from '../game-data/operatorDefinition';
import type {
  CompiledTimelineAction,
  CompiledAbilityEntityChildSkillProgram,
  CompiledSkillProgram,
  ResolvedActionSequence,
  ResolvedAbilityEntityDefinition,
  ResolvedCombatStep,
  ResolvedSkillBuffDefinition,
  ResolvedStatusModifier,
} from './combatProgram';

/** 编译一个技能所需的定义、等级和稳定来源身份。 */
export interface CompileSkillInput {
  readonly operatorId: string;
  readonly skillGroupKey: string;
  readonly skillType: SkillType;
  readonly skillLevel: number;
  readonly skill: SkillDefinition;
  readonly abilityEntityDefinitions?: OperatorAbilityEntityDefinitions;
}

interface AbilityEntityCompileContext {
  readonly source: OperatorAbilityEntityDefinitions;
  readonly compiled: Record<string, ResolvedAbilityEntityDefinition>;
  readonly compiling: Set<string>;
}

function resolveLevelValue(value: LevelValues, skillLevel: number, path: string): number {
  if (skillLevel === 0 && typeof value !== 'number') {
    throw new TypeError(`${path} must not depend on a skill level inside an operator Buff`);
  }
  const resolved = typeof value === 'number' ? value : value[skillLevel - 1];
  if (resolved === undefined) {
    throw new RangeError(`${path} has no value for skill level ${skillLevel}`);
  }
  if (!Number.isFinite(resolved)) throw new TypeError(`${path} must resolve to a finite number`);
  return resolved;
}

function resolveLevelValueOrActionOperand(
  value: LevelValues | ActionValueOperand,
  skillLevel: number,
  path: string,
): number | ActionValueOperand {
  if (typeof value === 'object' && 'kind' in value) return value;
  return resolveLevelValue(value as LevelValues, skillLevel, path);
}

function resolveStatusModifier(
  modifier: StatusModifierDefinition,
  skillLevel: number,
  path: string,
): ResolvedStatusModifier {
  switch (modifier.kind) {
    case 'attackPercent':
      return {
        kind: modifier.kind,
        value: resolveLevelValue(modifier.value, skillLevel, `${path}.value`),
      };
    case 'susceptibility':
      return {
        kind: modifier.kind,
        damageTypes: modifier.damageTypes,
        value: resolveLevelValue(modifier.value, skillLevel, `${path}.value`),
        ...(modifier.attributeScaling === undefined
          ? {}
          : {
              attributeScaling: {
                attribute: modifier.attributeScaling.attribute,
                coefficient: resolveLevelValue(
                  modifier.attributeScaling.coefficient,
                  skillLevel,
                  `${path}.attributeScaling.coefficient`,
                ),
              },
            }),
        ...(modifier.cap === undefined
          ? {}
          : { cap: resolveLevelValue(modifier.cap, skillLevel, `${path}.cap`) }),
      };
    case 'slowed':
    case 'blockResourceGain':
    case 'resourceCostMultiplier':
    case 'skillCooldownMultiplier':
      return modifier;
  }
}

function resolveStep(
  step: CombatStepDefinition,
  skillLevel: number,
  path: string,
  abilityEntities?: AbilityEntityCompileContext,
): ResolvedCombatStep {
  const keyed = step.key === undefined ? {} : { key: step.key };
  switch (step.kind) {
    case 'mergeContextTargets':
      return { ...keyed, kind: step.kind, parameters: step.parameters };
    case 'findCharacterTeamTargets':
      return { ...keyed, kind: step.kind, parameters: step.parameters };
    case 'findUnfinishedProjectileTargets':
      return { ...keyed, kind: step.kind, parameters: step.parameters };
    case 'createSpatialPointTargets':
      return { ...keyed, kind: step.kind, parameters: step.parameters };
    case 'findOwnerSpawnedAbilityEntities':
      return { ...keyed, kind: step.kind, parameters: step.parameters };
    case 'pickContextTarget':
      return { ...keyed, kind: step.kind, parameters: step.parameters };
    case 'readAbilityEntityRemainingDuration':
      return { ...keyed, kind: step.kind, parameters: step.parameters };
    case 'setAbilityEntityRemainingDuration':
      return { ...keyed, kind: step.kind, parameters: step.parameters };
    case 'finishCurrentAbilityEntity':
    case 'finishActionOwnerAbilityEntity':
    case 'finishCurrentAbilityEntityWhenSourceDies':
      return { ...keyed, kind: step.kind, parameters: step.parameters };
    case 'startCurrentAbilityEntityChildSkill':
      return {
        ...keyed,
        kind: step.kind,
        parameters: {
          childSkill: compileAbilityEntityChildSkill(
            step.parameters.childSkill,
            skillLevel,
            `${path}.parameters.childSkill`,
            abilityEntities,
          ),
        },
      };
    case 'startCurrentAbilityEntityChildSkillById':
      return { ...keyed, kind: step.kind, parameters: step.parameters };
    case 'jumpTimeline':
      return { ...keyed, kind: step.kind, parameters: step.parameters };
    case 'finishTimeline':
      return { ...keyed, kind: step.kind, parameters: step.parameters };
    case 'reachSkillOperableBoundary':
      return { ...keyed, kind: step.kind, parameters: step.parameters };
    case 'markCurrentSkillCanDash':
    case 'markCurrentSkillCanInterrupt':
      return { ...keyed, kind: step.kind, parameters: step.parameters };
    case 'forEachContextTarget':
      return {
        ...keyed,
        kind: step.kind,
        parameters: step.parameters,
        body: resolveActionSequence(step.body, skillLevel, `${path}.body`, abilityEntities),
      };
    case 'repeatEachTick':
      return {
        ...keyed,
        kind: step.kind,
        parameters: step.parameters,
        body: resolveActionSequence(step.body, skillLevel, `${path}.body`, abilityEntities),
      };
    case 'repeatByActionValue':
      return {
        ...keyed,
        kind: step.kind,
        parameters: step.parameters,
        body: resolveActionSequence(step.body, skillLevel, `${path}.body`, abilityEntities),
      };
    case 'launchProjectile': {
      const timing = step.parameters.finish;
      if (typeof timing === 'number') {
        if (!Number.isFinite(timing) || timing <= 0)
          throw new RangeError(`${path}: invalid projectile duration`);
      } else if (
        timing !== 'firstTickReach' &&
        timing !== 'firstTickBlock' &&
        (!Number.isSafeInteger(timing.reachAfterTicks) ||
          timing.reachAfterTicks < 1 ||
          !Number.isFinite(timing.maxDurationSeconds) ||
          timing.maxDurationSeconds <= 0)
      ) {
        throw new RangeError(`${path}: invalid projectile reach timing`);
      }
      const recycle = step.parameters.recycleDelaySeconds ?? 0;
      if (!Number.isFinite(recycle) || recycle < 0)
        throw new RangeError(`${path}: invalid projectile recycle delay`);
      return {
        ...keyed,
        ...step,
        callbacks: step.callbacks.map(({ event, skill }, index) => {
          const callbackPath = `${path}.callbacks[${index}].skill`;
          if (!Number.isInteger(skill.naturalDurationFrames) || skill.naturalDurationFrames < 1)
            throw new RangeError(
              `${callbackPath}.naturalDurationFrames must be a positive integer`,
            );
          return {
            event,
            skill: {
              ...compileAbilityEntityChildSkill(skill, skillLevel, callbackPath, abilityEntities),
              naturalDurationFrames: skill.naturalDurationFrames,
              nativeSkillType: skill.nativeSkillType,
              castResource: {
                ...skill.castResource,
                cost: {
                  resource: skill.castResource.cost.resource,
                  value: resolveLevelValue(
                    skill.castResource.cost.value,
                    skillLevel,
                    `${callbackPath}.castResource.cost.value`,
                  ),
                  availabilityThreshold: resolveLevelValue(
                    skill.castResource.cost.availabilityThreshold,
                    skillLevel,
                    `${callbackPath}.castResource.cost.availabilityThreshold`,
                  ),
                },
              },
            },
          };
        }),
      };
    }
    case 'spawnAbilityEntity': {
      const { definition: inlineDefinition, ...parameters } = step.parameters;
      if (inlineDefinition === undefined) {
        if (abilityEntities === undefined) {
          throw new Error(
            `${path}: AbilityEntity '${parameters.abilityEntityId}' has no definition`,
          );
        }
        compileReferencedAbilityEntity(
          parameters.abilityEntityId,
          skillLevel,
          `${path}.parameters.abilityEntityId`,
          abilityEntities,
        );
        return { ...keyed, kind: step.kind, parameters };
      }
      return {
        ...keyed,
        kind: step.kind,
        parameters: {
          ...parameters,
          definition: compileAbilityEntityDefinition(
            inlineDefinition,
            skillLevel,
            `${path}.parameters.definition`,
            abilityEntities,
          ),
        },
      };
    }
    case 'dealDamage':
      return {
        ...keyed,
        kind: step.kind,
        parameters: {
          damageType: step.parameters.damageType,
          ...(step.parameters.calculation === undefined
            ? {}
            : { calculation: step.parameters.calculation }),
          attackScale: resolveLevelValueOrActionOperand(
            step.parameters.attackScale,
            skillLevel,
            `${path}.parameters.attackScale`,
          ),
          ...(step.parameters.takeAttackSnapshot ? { takeAttackSnapshot: true } : {}),
          ...(step.parameters.calculationMultiplier === undefined
            ? {}
            : {
                calculationMultiplier: resolveLevelValue(
                  step.parameters.calculationMultiplier,
                  skillLevel,
                  `${path}.parameters.calculationMultiplier`,
                ),
              }),
          ...(step.parameters.calculationAttribute === undefined
            ? {}
            : { calculationAttribute: step.parameters.calculationAttribute }),
          ...(step.parameters.calculationAddition === undefined
            ? {}
            : {
                calculationAddition: resolveLevelValueOrActionOperand(
                  step.parameters.calculationAddition,
                  skillLevel,
                  `${path}.parameters.calculationAddition`,
                ),
              }),
          tags: step.parameters.tags,
          ...(step.parameters.gameplayTags === undefined
            ? {}
            : { gameplayTags: step.parameters.gameplayTags }),
          ...(step.parameters.features === undefined ? {} : { features: step.parameters.features }),
          ...(step.parameters.instantAttributeModifiers === undefined
            ? {}
            : { instantAttributeModifiers: step.parameters.instantAttributeModifiers }),
          ...(step.parameters.instantDamageScaleModifiers === undefined
            ? {}
            : { instantDamageScaleModifiers: step.parameters.instantDamageScaleModifiers }),
          ...(step.parameters.stagger === undefined
            ? {}
            : {
                stagger: resolveLevelValueOrActionOperand(
                  step.parameters.stagger,
                  skillLevel,
                  `${path}.parameters.stagger`,
                ),
              }),
          ...(step.parameters.staggerMultiplier === undefined
            ? {}
            : {
                staggerMultiplier: resolveLevelValueOrActionOperand(
                  step.parameters.staggerMultiplier,
                  skillLevel,
                  `${path}.parameters.staggerMultiplier`,
                ),
              }),
          ...(step.parameters.staggerOnlyWhenCasterControlled
            ? { staggerOnlyWhenCasterControlled: true }
            : {}),
          ...(step.parameters.attackScalePerStatusStack === undefined
            ? {}
            : {
                attackScalePerStatusStack: {
                  ...step.parameters.attackScalePerStatusStack,
                  coefficient: resolveLevelValue(
                    step.parameters.attackScalePerStatusStack.coefficient,
                    skillLevel,
                    `${path}.parameters.attackScalePerStatusStack.coefficient`,
                  ),
                },
              }),
        },
      };
    case 'dealFixedDamage':
      return {
        ...keyed,
        kind: step.kind,
        parameters: {
          damageType: step.parameters.damageType,
          value: resolveLevelValueOrActionOperand(
            step.parameters.value,
            skillLevel,
            `${path}.parameters.value`,
          ),
          tags: step.parameters.tags,
          ...(step.parameters.features === undefined ? {} : { features: step.parameters.features }),
          ...(step.parameters.stagger === undefined
            ? {}
            : {
                stagger: resolveLevelValueOrActionOperand(
                  step.parameters.stagger,
                  skillLevel,
                  `${path}.parameters.stagger`,
                ),
              }),
          ...(step.parameters.staggerMultiplier === undefined
            ? {}
            : {
                staggerMultiplier: resolveLevelValueOrActionOperand(
                  step.parameters.staggerMultiplier,
                  skillLevel,
                  `${path}.parameters.staggerMultiplier`,
                ),
              }),
          ...(step.parameters.staggerOnlyWhenCasterControlled
            ? { staggerOnlyWhenCasterControlled: true }
            : {}),
        },
      };
    case 'dealStagger':
      return {
        ...keyed,
        kind: step.kind,
        parameters: {
          value: resolveLevelValueOrActionOperand(
            step.parameters.value,
            skillLevel,
            `${path}.parameters.value`,
          ),
          ...(step.parameters.valueMultiplier === undefined
            ? {}
            : {
                valueMultiplier: resolveLevelValueOrActionOperand(
                  step.parameters.valueMultiplier,
                  skillLevel,
                  `${path}.parameters.valueMultiplier`,
                ),
              }),
          ...(step.parameters.features === undefined ? {} : { features: step.parameters.features }),
        },
      };
    case 'heal': {
      const targetParameters =
        step.parameters.target === 'contextTarget'
          ? {
              target: step.parameters.target,
              contextKey: step.parameters.contextKey,
            }
          : { target: step.parameters.target };
      return {
        ...keyed,
        kind: step.kind,
        parameters:
          step.parameters.amount === undefined
            ? {
                ...targetParameters,
                ...(step.parameters.alwaysNext === undefined
                  ? {}
                  : { alwaysNext: step.parameters.alwaysNext }),
                ...(step.parameters.source === undefined ? {} : { source: step.parameters.source }),
                attribute: step.parameters.attribute,
                ...(step.parameters.attributeSource === undefined
                  ? {}
                  : { attributeSource: step.parameters.attributeSource }),
                multiplier: resolveLevelValueOrActionOperand(
                  step.parameters.multiplier,
                  skillLevel,
                  `${path}.parameters.multiplier`,
                ),
                addition: resolveLevelValueOrActionOperand(
                  step.parameters.addition,
                  skillLevel,
                  `${path}.parameters.addition`,
                ),
                tags: step.parameters.tags,
              }
            : {
                ...targetParameters,
                ...(step.parameters.alwaysNext === undefined
                  ? {}
                  : { alwaysNext: step.parameters.alwaysNext }),
                ...(step.parameters.source === undefined ? {} : { source: step.parameters.source }),
                amount: resolveLevelValueOrActionOperand(
                  step.parameters.amount,
                  skillLevel,
                  `${path}.parameters.amount`,
                ),
                tags: step.parameters.tags,
              },
      };
    }
    case 'changeResource':
      return {
        ...keyed,
        kind: step.kind,
        parameters: {
          resource: step.parameters.resource,
          amount: resolveLevelValue(
            step.parameters.amount,
            skillLevel,
            `${path}.parameters.amount`,
          ),
          ...(step.parameters.coefficient === undefined
            ? {}
            : {
                coefficient: resolveLevelValue(
                  step.parameters.coefficient,
                  skillLevel,
                  `${path}.parameters.coefficient`,
                ),
              }),
          recipient: step.parameters.recipient,
          ...(step.parameters.spGainKind === undefined
            ? {}
            : { spGainKind: step.parameters.spGainKind }),
          ...(step.parameters.spGainSource === undefined
            ? {}
            : { spGainSource: step.parameters.spGainSource }),
          ...(step.parameters.isPercentValue === undefined
            ? {}
            : { isPercentValue: step.parameters.isPercentValue }),
          ...(step.parameters.ultimateRecoveryTag === undefined
            ? {}
            : {
                ultimateRecoveryTag: step.parameters.ultimateRecoveryTag,
              }),
          ...(step.parameters.ignoreUltimateEnergyGainMultiplier === undefined
            ? {}
            : {
                ignoreUltimateEnergyGainMultiplier:
                  step.parameters.ignoreUltimateEnergyGainMultiplier,
              }),
        },
      };
    case 'restrictUltimateEnergyRecovery':
      return {
        ...keyed,
        kind: step.kind,
        parameters: {
          ...step.parameters,
          allowedRecoveryTags: step.parameters.allowedRecoveryTags,
        },
      };
    case 'applyStatus':
      return {
        ...keyed,
        kind: step.kind,
        parameters: {
          statusKey: step.parameters.statusKey,
          target: step.parameters.target,
          ...(step.parameters.stacks === undefined ? {} : { stacks: step.parameters.stacks }),
          ...(step.parameters.maxStacks === undefined
            ? {}
            : { maxStacks: step.parameters.maxStacks }),
          ...(step.parameters.durationFrames === undefined
            ? {}
            : {
                durationFrames: resolveLevelValue(
                  step.parameters.durationFrames,
                  skillLevel,
                  `${path}.parameters.durationFrames`,
                ),
              }),
          ...(step.parameters.modifiers === undefined
            ? {}
            : {
                modifiers: step.parameters.modifiers.map((modifier, index) =>
                  resolveStatusModifier(
                    modifier,
                    skillLevel,
                    `${path}.parameters.modifiers[${index}]`,
                  ),
                ),
              }),
        },
      };
    case 'switch':
      return {
        ...keyed,
        kind: step.kind,
        parameters: step.parameters,
        options: step.options.map((option, index) => ({
          value: option.value,
          sequence: resolveActionSequence(
            option.sequence,
            skillLevel,
            `${path}.options[${index}].sequence`,
            abilityEntities,
          ),
        })),
      };
    case 'conditional':
      return {
        ...keyed,
        kind: step.kind,
        parameters: step.parameters,
        whenTrue: resolveActionSequence(
          step.whenTrue,
          skillLevel,
          `${path}.whenTrue`,
          abilityEntities,
        ),
        ...(step.whenFalse === undefined
          ? {}
          : {
              whenFalse: resolveActionSequence(
                step.whenFalse,
                skillLevel,
                `${path}.whenFalse`,
                abilityEntities,
              ),
            }),
      };
    case 'once':
      return {
        ...keyed,
        kind: step.kind,
        parameters: step.parameters,
        body: resolveActionSequence(step.body, skillLevel, `${path}.body`, abilityEntities),
      };
    case 'withActionBlackboardScope':
      if (step.parameters.shareParentBlackboard === true) {
        if (
          Object.keys(step.parameters.initialValues).length !== 0 ||
          step.parameters.inheritParent !== true ||
          step.parameters.entityInitialValues !== undefined ||
          step.parameters.entityAssignments !== undefined
        ) {
          throw new Error(
            `${path}: shareParentBlackboard requires empty initialValues, inheritParent=true, and no entity blackboard configuration`,
          );
        }
      }
      return {
        ...keyed,
        kind: step.kind,
        parameters: {
          scopeKey: step.parameters.scopeKey,
          ...(step.parameters.lifetime === undefined ? {} : { lifetime: step.parameters.lifetime }),
          ...(step.parameters.alwaysNext === undefined
            ? {}
            : { alwaysNext: step.parameters.alwaysNext }),
          ...(step.parameters.shareParentBlackboard === undefined
            ? {}
            : { shareParentBlackboard: step.parameters.shareParentBlackboard }),
          inheritParent: step.parameters.inheritParent,
          initialValues: Object.fromEntries(
            Object.entries(step.parameters.initialValues).map(([key, value]) => [
              key,
              resolveLevelValue(value, skillLevel, `${path}.parameters.initialValues.${key}`),
            ]),
          ),
          ...(step.parameters.entityInitialValues === undefined
            ? {}
            : {
                entityInitialValues: Object.fromEntries(
                  Object.entries(step.parameters.entityInitialValues).map(([key, value]) => [
                    key,
                    resolveLevelValue(
                      value,
                      skillLevel,
                      `${path}.parameters.entityInitialValues.${key}`,
                    ),
                  ]),
                ),
              }),
          ...(step.parameters.entityAssignments === undefined
            ? {}
            : { entityAssignments: step.parameters.entityAssignments }),
        },
        body: resolveActionSequence(step.body, skillLevel, `${path}.body`, abilityEntities),
      };
    case 'readBuffBlackboard':
      return {
        ...keyed,
        kind: step.kind,
        parameters: {
          ...step.parameters,
          query:
            step.parameters.query.kind === 'tag'
              ? {
                  ...step.parameters.query,
                  buffTags: step.parameters.query.buffTags,
                }
              : step.parameters.query,
        },
      };
    case 'readEventBuffBlackboard':
      return { ...keyed, kind: step.kind, parameters: step.parameters };
    case 'readCurrentBuffRemainingDuration':
      return { ...keyed, kind: step.kind, parameters: step.parameters };
    case 'readBuffRemainingDuration':
      return { ...keyed, kind: step.kind, parameters: step.parameters };
    case 'setCurrentBuffRemainingDuration':
      return { ...keyed, kind: step.kind, parameters: step.parameters };
    case 'refreshCurrentBuffAttributeModifiers':
    case 'skillAffix':
      return { ...keyed, kind: step.kind, parameters: step.parameters };
    case 'readBuffStackCount':
      return {
        ...keyed,
        kind: step.kind,
        parameters: {
          ...step.parameters,
          query:
            step.parameters.query.kind === 'tag'
              ? {
                  ...step.parameters.query,
                  buffTags: step.parameters.query.buffTags,
                }
              : step.parameters.query,
        },
      };
    case 'finishBuffsByTag':
      return {
        ...keyed,
        kind: step.kind,
        parameters: {
          ...step.parameters,
          buffTags: step.parameters.buffTags,
        },
      };
    case 'finishBuffsById':
      return { ...keyed, kind: step.kind, parameters: step.parameters };
    case 'finishCurrentBuff':
      return { ...keyed, kind: step.kind, parameters: step.parameters };
    case 'setCurrentBuffTimePaused':
      return { ...keyed, kind: step.kind, parameters: step.parameters };
    case 'igniteBuffs':
      return { ...keyed, kind: step.kind, parameters: step.parameters };
    case 'holdBuffsById':
      return { ...keyed, kind: step.kind, parameters: step.parameters };
    case 'inheritBuffById':
      return { ...keyed, kind: step.kind, parameters: step.parameters };
    case 'createTimedMarker':
      return { ...keyed, kind: step.kind, parameters: step.parameters };
    case 'setGlobalCooldown':
      return { ...keyed, kind: step.kind, parameters: step.parameters };
    case 'createAbilityEntityTimedMarker':
      return { ...keyed, kind: step.kind, parameters: step.parameters };
    case 'startTimeDilation':
      return { ...keyed, kind: step.kind, parameters: step.parameters };
    case 'startUltimateTimeDilation':
      return { ...keyed, kind: step.kind, parameters: step.parameters };
    case 'hideUi':
      return { ...keyed, kind: step.kind, parameters: step.parameters };
    case 'setIgnoreGlobalTimeScale':
      return { ...keyed, kind: step.kind, parameters: step.parameters };
    case 'storeCurrentTimelineFrame':
      return { ...keyed, kind: step.kind, parameters: step.parameters };
    case 'storeEventSpGainAmount':
      return { ...keyed, kind: step.kind, parameters: step.parameters };
    case 'storeEventHealValues':
      return { ...keyed, kind: step.kind, parameters: step.parameters };
    case 'storeShieldValue':
      return { ...keyed, kind: step.kind, parameters: step.parameters };
    case 'modifyActionValue':
      return { ...keyed, kind: step.kind, parameters: step.parameters };
    case 'calculateActionValue':
      return { ...keyed, kind: step.kind, parameters: step.parameters };
    case 'storeSourceAttributeValue':
      return { ...keyed, kind: step.kind, parameters: step.parameters };
    case 'storeEntityPropertyValue':
      return { ...keyed, kind: step.kind, parameters: step.parameters };
    case 'setHealthFloor':
      return { ...keyed, kind: step.kind, parameters: step.parameters };
    case 'changeResourceByActionValue': {
      const { coefficient, ultimateRecoveryTag, ...parameters } = step.parameters;
      return {
        ...keyed,
        kind: step.kind,
        parameters: {
          ...parameters,
          ...(ultimateRecoveryTag === undefined
            ? {}
            : { ultimateRecoveryTag: ultimateRecoveryTag }),
          ...(coefficient === undefined
            ? {}
            : {
                coefficient: resolveLevelValueOrActionOperand(
                  coefficient,
                  skillLevel,
                  `${path}.parameters.coefficient`,
                ),
              }),
        },
      };
    }
    case 'recoverDashEnergy':
      return { ...keyed, kind: step.kind, parameters: step.parameters };
    case 'recordPerfectDodge':
      return { ...keyed, kind: step.kind, parameters: step.parameters };
    case 'gainSquadUltimateEnergyFromSkillCost':
      return {
        ...keyed,
        kind: step.kind,
        parameters: {
          coefficient: resolveLevelValue(
            step.parameters.coefficient,
            skillLevel,
            `${path}.parameters.coefficient`,
          ),
        },
      };
    case 'applyBuff': {
      const { definition, blackboardAssignments, ...parameters } = step.parameters;
      return {
        ...keyed,
        kind: step.kind,
        parameters: {
          ...parameters,
          ...(blackboardAssignments === undefined
            ? {}
            : {
                blackboardAssignments: Object.fromEntries(
                  Object.entries(blackboardAssignments).map(([key, value]) => [
                    key,
                    typeof value === 'object' && 'kind' in value
                      ? value
                      : {
                          kind: 'constant' as const,
                          value: resolveLevelValue(
                            value as LevelValues,
                            skillLevel,
                            `${path}.parameters.blackboardAssignments.${key}`,
                          ),
                        },
                  ]),
                ),
              }),
          ...(definition === undefined
            ? {}
            : {
                definition: resolveSkillBuffDefinition(
                  definition,
                  skillLevel,
                  `${path}.parameters.definition`,
                  abilityEntities,
                ),
              }),
        },
      };
    }
    case 'createGlobalBuff':
      return { ...keyed, kind: step.kind, parameters: step.parameters };
    case 'finishParentGlobalBuff':
      return { ...keyed, kind: step.kind, parameters: step.parameters };
    case 'finishGlobalBuffsById':
      return { ...keyed, kind: step.kind, parameters: step.parameters };
    case 'readSkillSettingData':
      return { ...keyed, kind: step.kind, parameters: step.parameters };
    case 'applyPhysicalInfliction': {
      const { noGuardDefinition, ...parameters } = step.parameters;
      const resolvedNoGuard = resolveSkillBuffDefinition(
        noGuardDefinition,
        skillLevel,
        `${path}.parameters.noGuardDefinition`,
        abilityEntities,
      );
      if (parameters.type === 'crush') {
        const { crushedDefinition, ...crushParameters } = parameters;
        return {
          ...keyed,
          kind: step.kind,
          parameters: {
            ...crushParameters,
            noGuardDefinition: resolvedNoGuard,
            crushedDefinition: resolveSkillBuffDefinition(
              crushedDefinition,
              skillLevel,
              `${path}.parameters.crushedDefinition`,
              abilityEntities,
            ),
          },
        };
      }
      if (parameters.type === 'airborne') {
        const { airborneDefinition, ...airborneParameters } = parameters;
        return {
          ...keyed,
          kind: step.kind,
          parameters: {
            ...airborneParameters,
            noGuardDefinition: resolvedNoGuard,
            airborneDefinition: resolveSkillBuffDefinition(
              airborneDefinition,
              skillLevel,
              `${path}.parameters.airborneDefinition`,
              abilityEntities,
            ),
          },
        };
      }
      const { fractureDefinition, ...fractureParameters } = parameters;
      return {
        ...keyed,
        kind: step.kind,
        parameters: {
          ...fractureParameters,
          noGuardDefinition: resolvedNoGuard,
          fractureDefinition: resolveSkillBuffDefinition(
            fractureDefinition,
            skillLevel,
            `${path}.parameters.fractureDefinition`,
            abilityEntities,
          ),
        },
      };
    }
    case 'applyElementalInfliction':
    case 'applyKnockDown':
    case 'triggerSpellBurst':
    case 'triggerCustomAbilityEvent':
    case 'castSkillDuringAction':
    case 'consumeElementalReaction':
    case 'outputAirborne':
    case 'outputKnockDown':
    case 'gainFinisherSp':
    case 'consumeStatus':
    case 'setContextFlag':
    case 'openComboWindow':
    case 'showComboRingQte':
    case 'changeSkillSlot':
    case 'overrideBasicAttackMapping':
    case 'overrideMultiDashLimit':
    case 'changePlayerActionMode':
    case 'changeNativeSkillType':
    case 'setCharacterPassiveUiValue':
    case 'inheritSkillCastInfoForBasicAttack':
    case 'adjustSkillCooldown':
      return { ...keyed, kind: step.kind, parameters: step.parameters } as ResolvedCombatStep;
    case 'applyElementalReaction':
      return {
        ...keyed,
        kind: step.kind,
        parameters: {
          ...step.parameters,
          durationSeconds: resolveLevelValueOrActionOperand(
            step.parameters.durationSeconds,
            skillLevel,
            `${path}.parameters.durationSeconds`,
          ),
        },
      };
    case 'listenForCombatEvents':
      return {
        ...keyed,
        kind: step.kind,
        parameters: {
          responses: step.parameters.responses.map((response, index) => ({
            key: response.key,
            event: response.event,
            ...(response.phase === undefined ? {} : { phase: response.phase }),
            ...(response.priority === undefined ? {} : { priority: response.priority }),
            ...(response.condition === undefined ? {} : { condition: response.condition }),
            sequence: compileActionSequence(
              response.sequence,
              skillLevel,
              `${path}.parameters.responses[${index}].sequence`,
              abilityEntities,
            ),
          })),
        },
      };
  }
}

function resolveSkillBuffDefinition(
  definition: SkillBuffDefinition,
  skillLevel: number,
  path: string,
  abilityEntities?: AbilityEntityCompileContext,
): ResolvedSkillBuffDefinition {
  const {
    scheduledSequences,
    lifecycleSequences,
    abilityEventResponses,
    igniteEventResponses,
    damageModifiers,
    ...fields
  } = definition;
  return {
    ...fields,
    ...(damageModifiers === undefined
      ? {}
      : {
          damageModifiers: damageModifiers.map((modifier, index) => {
            const { conditionProgram, ...fields } = modifier;
            if (conditionProgram !== undefined && modifier.condition !== undefined) {
              throw new Error(
                `${path}.damageModifiers[${index}] cannot define both condition and conditionProgram`,
              );
            }
            return {
              ...fields,
              ...(conditionProgram === undefined
                ? {}
                : {
                    conditionProgram: compileActionSequence(
                      conditionProgram,
                      skillLevel,
                      `${path}.damageModifiers[${index}].conditionProgram`,
                      abilityEntities,
                    ),
                  }),
            };
          }),
        }),
    ...(scheduledSequences === undefined
      ? {}
      : {
          scheduledSequences: scheduledSequences.map((scheduled, index) => ({
            startFrame: scheduled.startFrame,
            ...(scheduled.endFrame === undefined ? {} : { endFrame: scheduled.endFrame }),
            sequence: compileActionSequence(
              scheduled.sequence,
              skillLevel,
              `${path}.scheduledSequences[${index}].sequence`,
              abilityEntities,
            ),
          })),
        }),
    ...(lifecycleSequences === undefined
      ? {}
      : {
          lifecycleSequences: Object.fromEntries(
            Object.entries(lifecycleSequences).map(([key, sequence]) => [
              key,
              compileActionSequence(
                sequence,
                skillLevel,
                `${path}.lifecycleSequences.${key}`,
                abilityEntities,
              ),
            ]),
          ),
        }),
    ...(abilityEventResponses === undefined
      ? {}
      : {
          abilityEventResponses: abilityEventResponses.map((response, index) => ({
            event: response.event,
            priority: response.priority,
            sequence: compileActionSequence(
              response.sequence,
              skillLevel,
              `${path}.abilityEventResponses[${index}].sequence`,
              abilityEntities,
            ),
          })),
        }),
    ...(igniteEventResponses === undefined
      ? {}
      : {
          igniteEventResponses: igniteEventResponses.map((response, index) => ({
            igniteType: response.igniteType,
            finishAfterIgnited: response.finishAfterIgnited,
            sequence: compileActionSequence(
              response.sequence,
              skillLevel,
              `${path}.igniteEventResponses[${index}].sequence`,
              abilityEntities,
            ),
          })),
        }),
  };
}

/** 按技能等级编译干员级 Buff 蓝图；其中的后代 applyBuff 仍只保留 ID。 */
export function compileOperatorBuffDefinitions(
  definitions: Readonly<Record<string, SkillBuffDefinition>> | undefined,
): Readonly<Record<string, ResolvedSkillBuffDefinition>> {
  return compileOperatorBuffResources(definitions).buffDefinitions;
}

/**
 * 编译干员级 Buff 及其直接引用的能力实体闭包。Buff 本身不绑定技能等级，
 * 因而其后代能力实体同样不得读取等级数组；运行时由来源动作提供施法黑板。
 */
export function compileOperatorBuffResources(
  definitions: Readonly<Record<string, SkillBuffDefinition>> | undefined,
  abilityEntityDefinitions?: OperatorAbilityEntityDefinitions,
): {
  readonly buffDefinitions: Readonly<Record<string, ResolvedSkillBuffDefinition>>;
  readonly abilityEntityDefinitions: Readonly<Record<string, ResolvedAbilityEntityDefinition>>;
} {
  const abilityEntities: AbilityEntityCompileContext | undefined =
    abilityEntityDefinitions === undefined
      ? undefined
      : {
          source: abilityEntityDefinitions,
          compiled: {},
          compiling: new Set(),
        };
  if (definitions === undefined) {
    return { buffDefinitions: {}, abilityEntityDefinitions: {} };
  }
  const buffDefinitions = Object.fromEntries(
    Object.entries(definitions).map(([buffId, definition]) => {
      if (buffId.length === 0) throw new Error('operator buff definition ID must not be empty');
      return [
        buffId,
        resolveSkillBuffDefinition(
          definition,
          0,
          `buffDefinitions.${JSON.stringify(buffId)}`,
          abilityEntities,
        ),
      ];
    }),
  );
  return {
    buffDefinitions,
    abilityEntityDefinitions: abilityEntities?.compiled ?? {},
  };
}

/** 将任意定义来源的等级化动作序列解析为运行时序列。 */
export function compileActionSequence(
  sequence: ActionSequenceDefinition,
  skillLevel: number,
  path = 'sequence',
  abilityEntities?: AbilityEntityCompileContext,
): ResolvedActionSequence {
  return resolveActionSequence(sequence, skillLevel, path, abilityEntities);
}

function resolveActionSequence(
  sequence: ActionSequenceDefinition,
  skillLevel: number,
  path: string,
  abilityEntities?: AbilityEntityCompileContext,
): ResolvedActionSequence {
  return {
    steps: sequence.steps.map((step, index) =>
      resolveStep(step, skillLevel, `${path}.steps[${index}]`, abilityEntities),
    ),
  };
}

function compileAbilityEntityDefinition(
  definition: AbilityEntityDefinition,
  skillLevel: number,
  path: string,
  abilityEntities?: AbilityEntityCompileContext,
): ResolvedAbilityEntityDefinition {
  return {
    ...(definition.bornTags === undefined ? {} : { bornTags: definition.bornTags }),
    ...(definition.blackboard === undefined ? {} : { blackboard: definition.blackboard }),
    lifetime: definition.lifetime,
    ...(definition.deathReleaseDelaySeconds === undefined
      ? {}
      : { deathReleaseDelaySeconds: definition.deathReleaseDelaySeconds }),
    ...(definition.maxStackingCount === undefined
      ? {}
      : { maxStackingCount: definition.maxStackingCount }),
    ...(definition.childSkill === undefined
      ? {}
      : {
          childSkill: compileAbilityEntityChildSkill(
            definition.childSkill,
            skillLevel,
            `${path}.childSkill`,
            abilityEntities,
          ),
        }),
    ...(definition.childSkills === undefined
      ? {}
      : {
          childSkills: Object.fromEntries(
            Object.entries(definition.childSkills).map(([skillId, childSkill]) => [
              skillId,
              compileAbilityEntityChildSkill(
                childSkill,
                skillLevel,
                `${path}.childSkills.${JSON.stringify(skillId)}`,
                abilityEntities,
              ),
            ]),
          ),
        }),
    ...(definition.passiveSkills === undefined
      ? {}
      : {
          passiveSkills: definition.passiveSkills.map((passive, index) => ({
            key: passive.key,
            initialBlackboard: compileSkillBlackboard(
              passive.blackboard,
              skillLevel,
              `${path}.passiveSkills[${index}].blackboard`,
            ),
            enableSequence: resolveActionSequence(
              passive.enableSequence,
              skillLevel,
              `${path}.passiveSkills[${index}].enableSequence`,
              abilityEntities,
            ),
            ...(passive.abilityEventResponses === undefined
              ? {}
              : {
                  abilityEventResponses: passive.abilityEventResponses.map(
                    (response, responseIndex) => ({
                      ...response,
                      sequence: resolveActionSequence(
                        response.sequence,
                        skillLevel,
                        `${path}.passiveSkills[${index}].abilityEventResponses[${responseIndex}].sequence`,
                        abilityEntities,
                      ),
                    }),
                  ),
                }),
          })),
        }),
  };
}

function compileReferencedAbilityEntity(
  abilityEntityId: string,
  skillLevel: number,
  path: string,
  context: AbilityEntityCompileContext,
): void {
  if (context.compiled[abilityEntityId] !== undefined || context.compiling.has(abilityEntityId)) {
    return;
  }
  const definition = context.source[abilityEntityId];
  if (definition === undefined) {
    throw new Error(`${path}: AbilityEntity definition '${abilityEntityId}' does not exist`);
  }
  context.compiling.add(abilityEntityId);
  try {
    context.compiled[abilityEntityId] = compileAbilityEntityDefinition(
      definition,
      skillLevel,
      `abilityEntityDefinitions.${JSON.stringify(abilityEntityId)}`,
      context,
    );
  } finally {
    context.compiling.delete(abilityEntityId);
  }
}

function compileSkillBlackboard(
  blackboard: SkillActionProgramDefinition['blackboard'],
  skillLevel: number,
  path: string,
): Readonly<Record<string, number>> {
  return Object.fromEntries(
    Object.entries(blackboard ?? {}).map(([key, value]) => [
      key,
      resolveLevelValue(value, skillLevel, `${path}.${key}`),
    ]),
  );
}

function compileSkillTimelineActions(
  sequences: SkillActionProgramDefinition['scheduledSequences'],
  skillLevel: number,
  path: string,
  abilityEntities?: AbilityEntityCompileContext,
): readonly CompiledTimelineAction[] {
  return sequences.map((scheduled, index) => ({
    startFrame: scheduled.startFrame,
    ...(scheduled.endFrame === undefined ? {} : { endFrame: scheduled.endFrame }),
    sequence: compileActionSequence(
      scheduled.sequence,
      skillLevel,
      `${path}[${index}].sequence`,
      abilityEntities,
    ),
  }));
}

function compileAbilityEntityChildSkill(
  childSkill: AbilityEntityChildSkillDefinition,
  skillLevel: number,
  path: string,
  abilityEntities?: AbilityEntityCompileContext,
): CompiledAbilityEntityChildSkillProgram {
  if (!Number.isInteger(childSkill.naturalDurationFrames) || childSkill.naturalDurationFrames < 1)
    throw new RangeError(`${path}.naturalDurationFrames must be a positive integer`);
  return {
    skillId: childSkill.skillId,
    nativeSkillType: childSkill.nativeSkillType,
    naturalDurationFrames: childSkill.naturalDurationFrames,
    castResource: {
      ...childSkill.castResource,
      cost: {
        resource: childSkill.castResource.cost.resource,
        value: resolveLevelValue(
          childSkill.castResource.cost.value,
          skillLevel,
          `${path}.castResource.cost.value`,
        ),
        availabilityThreshold: resolveLevelValue(
          childSkill.castResource.cost.availabilityThreshold,
          skillLevel,
          `${path}.castResource.cost.availabilityThreshold`,
        ),
      },
    },
    initialBlackboard: compileSkillBlackboard(
      childSkill.blackboard,
      skillLevel,
      `${path}.blackboard`,
    ),
    timelineActions: compileSkillTimelineActions(
      childSkill.scheduledSequences,
      skillLevel,
      `${path}.scheduledSequences`,
      abilityEntities,
    ),
  };
}

/** 仅解析等级化费用，供资源上限展示与完整技能编译共用。 */
export function compileSkillCosts(skill: Pick<SkillDefinition, 'costs'>, skillLevel: number) {
  return (skill.costs ?? []).map((cost, index) => ({
    resource: cost.resource,
    value: resolveLevelValue(cost.value, skillLevel, `costs[${index}].value`),
  }));
}

export function compileSkill(input: CompileSkillInput): CompiledSkillProgram {
  if (!Number.isInteger(input.skillLevel) || input.skillLevel <= 0) {
    throw new RangeError('skillLevel must be a positive integer');
  }
  if (!Number.isInteger(input.skill.timelineBlockFrames) || input.skill.timelineBlockFrames < 0) {
    throw new RangeError(
      `skill '${input.skill.key}' must use non-negative integer timelineBlockFrames`,
    );
  }
  if (
    input.skill.naturalDurationFrames !== undefined &&
    (!Number.isInteger(input.skill.naturalDurationFrames) || input.skill.naturalDurationFrames <= 0)
  ) {
    throw new RangeError(
      `skill '${input.skill.key}' must use positive integer naturalDurationFrames`,
    );
  }
  if (input.skill.eventHandlers?.length) {
    throw new Error(
      `skill '${input.skill.key}' uses legacy eventHandlers without a listener interval`,
    );
  }
  const costs = compileSkillCosts(input.skill, input.skillLevel);
  const initialBlackboard = compileSkillBlackboard(
    input.skill.blackboard,
    input.skillLevel,
    'blackboard',
  );
  if (
    input.skill.smartTarget !== undefined &&
    input.skill.smartTarget !== 'enemy' &&
    input.skill.smartTarget !== 'input' &&
    input.skill.smartTarget !== 'trigger'
  )
    throw new Error(`skill '${input.skill.key}' has unsupported smartTarget`);
  const cooldownFrames =
    input.skill.cooldownFrames === undefined
      ? undefined
      : resolveLevelValue(input.skill.cooldownFrames, input.skillLevel, 'cooldownFrames');
  if (costs.length > 1) {
    throw new Error(
      `skill '${input.skill.key}' has multiple costs, but native CastData has one cost`,
    );
  }
  if (
    input.skill.switchToBuffCast !== undefined &&
    input.skill.switchToBuffCast.asSkillCast !== true &&
    (costs.some(cost => cost.value !== 0) || cooldownFrames !== undefined)
  ) {
    throw new Error(
      `skill '${input.skill.key}' uses the strict zero-cost SwitchToAddBuff runtime subset`,
    );
  }
  if (costs.some(cost => cost.value < 0)) {
    throw new RangeError(`skill '${input.skill.key}' cost must not be negative`);
  }
  if (costs.length > 0 && input.skill.costFrame === undefined) {
    throw new Error(`skill '${input.skill.key}' has costs but no recovered costFrame`);
  }
  if (
    input.skill.costFrame !== undefined &&
    (!Number.isInteger(input.skill.costFrame) || input.skill.costFrame < 0)
  ) {
    throw new RangeError(`skill '${input.skill.key}' must use a non-negative integer costFrame`);
  }
  if (cooldownFrames !== undefined && (!Number.isInteger(cooldownFrames) || cooldownFrames <= 0)) {
    throw new RangeError(`skill '${input.skill.key}' must use positive integer cooldownFrames`);
  }
  const abilityEntities: AbilityEntityCompileContext | undefined =
    input.abilityEntityDefinitions === undefined
      ? undefined
      : {
          source: input.abilityEntityDefinitions,
          compiled: {},
          compiling: new Set(),
        };
  const program: CompiledSkillProgram = {
    operatorId: input.operatorId,
    skillGroupKey: input.skillGroupKey,
    skillId: input.skill.key,
    skillType: input.skillType,
    ...(input.skill.nativeSkillType === undefined
      ? {}
      : { nativeSkillType: input.skill.nativeSkillType }),
    skillLevel: input.skillLevel,
    initialBlackboard,
    ...(input.skill.smartTarget === undefined ? {} : { smartTarget: input.skill.smartTarget }),
    timelineBlockFrames: input.skill.timelineBlockFrames,
    ...(input.skill.timelineBlockFollowUpSkillId === undefined
      ? {}
      : { timelineBlockFollowUpSkillId: input.skill.timelineBlockFollowUpSkillId }),
    ...(input.skill.timelineContinuationSkillId === undefined
      ? {}
      : { timelineContinuationSkillId: input.skill.timelineContinuationSkillId }),
    ...(input.skill.naturalDurationFrames === undefined
      ? {}
      : { naturalDurationFrames: input.skill.naturalDurationFrames }),
    ...(input.skill.exclusiveFrame === undefined
      ? {}
      : { exclusiveFrame: input.skill.exclusiveFrame }),
    ...(input.skill.offsetRecordFrame === undefined
      ? {}
      : { offsetRecordFrame: input.skill.offsetRecordFrame }),
    ...(input.skill.inputWindows === undefined ? {} : { inputWindows: input.skill.inputWindows }),
    ...(cooldownFrames === undefined ? {} : { cooldownFrames }),
    ...(input.skill.costFrame === undefined ? {} : { costFrame: input.skill.costFrame }),
    costs,
    ...(input.skill.switchToBuffCast === undefined
      ? {}
      : {
          switchToBuffCast: {
            ...(input.skill.switchToBuffCast.currentSkillTypes === undefined
              ? {}
              : { currentSkillTypes: input.skill.switchToBuffCast.currentSkillTypes }),
            ...(input.skill.switchToBuffCast.requiresCurrentSkillNotInterruptible === undefined
              ? {}
              : {
                  requiresCurrentSkillNotInterruptible:
                    input.skill.switchToBuffCast.requiresCurrentSkillNotInterruptible,
                }),
            ...(input.skill.switchToBuffCast.condition === undefined
              ? {}
              : { condition: input.skill.switchToBuffCast.condition }),
            asSkillCast: input.skill.switchToBuffCast.asSkillCast === true,
            sequence: compileActionSequence(
              input.skill.switchToBuffCast.sequence,
              input.skillLevel,
              'switchToBuffCast.sequence',
              abilityEntities,
            ),
          },
        }),
    timelineActions: compileSkillTimelineActions(
      input.skill.scheduledSequences,
      input.skillLevel,
      'scheduledSequences',
      abilityEntities,
    ),
  };
  return abilityEntities === undefined || Object.keys(abilityEntities.compiled).length === 0
    ? program
    : { ...program, abilityEntityDefinitions: abilityEntities.compiled };
}
