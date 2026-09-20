/**
 * 动作程序的严格结构校验。序列、内联能力实体和子技能互相递归，保留同一校验入口；
 * 条件和值规则独立复用，Buff 安装校验通过回调继续检查嵌套程序。
 */
import {
  BUFF_TAG_FINISH_TARGETS,
  DIRECT_COMBAT_EVENT_TRIGGER_EVENTS,
} from '../../../../packages/game-data-contract/src/actions';
import {
  ACTION_VALUE_CALCULATION_OPERATIONS,
  ACTION_VALUE_OPERATIONS,
  BUFF_APPLICATION_TARGETS,
  BUFF_SINGLE_TARGETS,
  COMBAT_STEP_KINDS,
  GLOBAL_COOLDOWN_TARGETS,
  DAMAGE_CALCULATIONS,
  HEAL_TARGETS,
  OPERATOR_ATTRIBUTES,
  RESOURCE_RECIPIENTS,
  SP_GAIN_KINDS,
  SP_GAIN_SOURCES,
  SKILL_TRIGGER_SCOPES,
  STATUS_MODIFIER_KINDS,
  TIME_DILATION_IGNORE_TARGETS,
  TIME_DILATION_ENTITY_TARGETS,
} from '../operatorDefinition';
import {
  ATTRIBUTE_MODIFIER_SLOTS,
  ATTRIBUTE_MODIFIER_TIMINGS,
  DAMAGE_MODIFIER_SIDES,
  DAMAGE_SCALE_SIDES,
  DAMAGE_SCALE_ZONES,
} from '../../../../packages/game-data-contract/src/modifiers';
import {
  type SkillDefinitionValidationIssue,
  DAMAGE_TYPES_SET,
  DAMAGE_TAGS_SET,
  INFLICTION_ELEMENTS_SET,
  ELEMENTAL_REACTIONS_SET,
  COMBAT_TARGETS_SET,
  TIMED_MARKER_TARGETS_SET,
  OPERATOR_ATTRIBUTES_SET,
  PHYSICAL_INFLICTION_TYPES_SET,
  SKILL_TYPES_SET,
  TAG_QUERY_TYPES_SET,
  push,
  asRecord,
  requireString,
  requireFiniteNumber,
  requireNonNegativeInteger,
  requireBoolean,
  requireEnum,
  validateLevelValues,
  validateActionValueOperand,
  validateActionStringOperand,
  validateLevelValuesOrActionValueOperand,
  validateNonEmptyStringArray,
  validateDamageTags,
  validateDamageFeatures,
  validateScalar,
  validateElements,
  validateGameplayTag,
  validateGameplayTags,
  BUFF_APPLICATION_SOURCES_SET,
  requireInteger,
} from './definitionValues';
import { validateCombatCondition } from './combatConditions';
import { validateBuffApplication } from './buffApplication';
import { NATIVE_SKILL_TYPES_SET, COMBAT_RESOURCES_SET } from './definitionValues';

const STEP_KINDS = new Set<string>(COMBAT_STEP_KINDS);

const HEAL_TARGETS_SET = new Set<string>(HEAL_TARGETS);

const TIME_DILATION_IGNORE_TARGETS_SET = new Set<string>(TIME_DILATION_IGNORE_TARGETS);

const TIME_DILATION_ENTITY_TARGETS_SET = new Set<string>(TIME_DILATION_ENTITY_TARGETS);

const BUFF_SINGLE_TARGETS_SET = new Set<string>(BUFF_SINGLE_TARGETS);

const RESOURCE_RECIPIENTS_SET = new Set<string>(RESOURCE_RECIPIENTS);

const HEAL_CALCULATION_ATTRIBUTES_SET = new Set<string>([...OPERATOR_ATTRIBUTES, 'maxHealth']);

const DAMAGE_CALCULATIONS_SET = new Set<string>(DAMAGE_CALCULATIONS);

const SP_GAIN_KINDS_SET = new Set<string>(SP_GAIN_KINDS);

const SP_GAIN_SOURCES_SET = new Set<string>(SP_GAIN_SOURCES);

const STATUS_MODIFIER_KINDS_SET = new Set<string>(STATUS_MODIFIER_KINDS);

const ACTION_VALUE_OPERATIONS_SET = new Set<string>(ACTION_VALUE_OPERATIONS);

const ACTION_VALUE_CALCULATION_OPERATIONS_SET = new Set<string>(
  ACTION_VALUE_CALCULATION_OPERATIONS,
);

const DAMAGE_SCALE_SIDES_SET = new Set<string>(DAMAGE_SCALE_SIDES);

const DAMAGE_SCALE_ZONES_SET = new Set<string>(DAMAGE_SCALE_ZONES);

const DAMAGE_MODIFIER_SIDES_SET = new Set<string>(DAMAGE_MODIFIER_SIDES);

const ATTRIBUTE_MODIFIER_SLOTS_SET = new Set<string>(ATTRIBUTE_MODIFIER_SLOTS);

const ATTRIBUTE_MODIFIER_TIMINGS_SET = new Set<string>(ATTRIBUTE_MODIFIER_TIMINGS);

const BUFF_FINISH_REASONS_SET = new Set<string>(['early', 'absorbed', 'other']);

const TRIGGER_SCOPES_SET = new Set<string>(SKILL_TRIGGER_SCOPES);

function validateTimeScaleCurve(
  value: unknown,
  path: string,
  out: SkillDefinitionValidationIssue[],
): void {
  const record = asRecord(value, path, out);
  if (record === null) return;
  const kind = requireString(record, 'kind', path, out);
  if (kind === 'named') {
    const key = requireString(record, 'key', path, out);
    if (key !== null && key.length === 0) push(out, `${path}.key`, 'expected a non-empty string');
    return;
  }
  if (kind !== 'inline') {
    if (kind !== null) push(out, `${path}.kind`, "expected 'named' or 'inline'");
    return;
  }
  if (!Array.isArray(record.keys) || record.keys.length === 0) {
    push(out, `${path}.keys`, 'expected a non-empty array');
    return;
  }
  let previousTime = Number.NEGATIVE_INFINITY;
  record.keys.forEach((value, index) => {
    const keyPath = `${path}.keys[${index}]`;
    const key = asRecord(value, keyPath, out);
    if (key === null) return;
    for (const field of ['time', 'value', 'inWeight', 'outWeight']) {
      requireFiniteNumber(key, field, keyPath, out);
    }
    for (const field of ['inTangent', 'outTangent']) {
      const tangent = key[field];
      if (typeof tangent !== 'number' || Number.isNaN(tangent))
        push(out, `${keyPath}.${field}`, 'expected a number other than NaN');
    }
    const time = key.time;
    if (typeof time === 'number' && Number.isFinite(time)) {
      if (time <= previousTime) push(out, `${keyPath}.time`, 'expected strictly increasing times');
      previousTime = time;
    }
    const weightedMode = key.weightedMode;
    if (
      typeof weightedMode !== 'number' ||
      !Number.isInteger(weightedMode) ||
      weightedMode < 0 ||
      weightedMode > 3
    ) {
      push(out, `${keyPath}.weightedMode`, 'expected an integer from 0 to 3');
    }
  });
}

function validateCombatTargetArray(
  value: unknown,
  path: string,
  out: SkillDefinitionValidationIssue[],
  allowEmpty: boolean,
  allowedTargets: ReadonlySet<string> = COMBAT_TARGETS_SET,
): void {
  if (!Array.isArray(value) || (!allowEmpty && value.length === 0)) {
    push(out, path, allowEmpty ? 'expected an array' : 'expected a non-empty array');
    return;
  }
  value.forEach((target, index) => {
    if (typeof target !== 'string' || !allowedTargets.has(target)) {
      push(out, `${path}[${index}]`, 'unknown combat target');
    }
  });
}

function validateAbilityEntityTargetQueries(
  value: unknown,
  path: string,
  out: SkillDefinitionValidationIssue[],
): boolean {
  if (!Array.isArray(value) || value.length === 0) {
    push(out, path, 'expected a non-empty array');
    return false;
  }
  value.forEach((entry, index) => {
    const queryPath = `${path}[${index}]`;
    const query = asRecord(entry, queryPath, out);
    if (query === null) return;
    const kind = requireEnum(
      query,
      'kind',
      new Set(['current', 'ownerSpawned', 'context']),
      queryPath,
      out,
    );
    if (kind === 'current') return;
    if (kind === 'context') {
      requireString(query, 'contextKey', queryPath, out);
      return;
    }
    if (query.abilityEntityIds !== undefined) {
      validateNonEmptyStringArray(query.abilityEntityIds, `${queryPath}.abilityEntityIds`, out);
    }
  });
  return true;
}

/** 可为空但每一项都必须是非空字符串的数组。 */
function validateStringArray(
  value: unknown,
  path: string,
  out: SkillDefinitionValidationIssue[],
): void {
  if (!Array.isArray(value)) {
    push(out, path, 'expected an array');
    return;
  }
  value.forEach((entry, index) => {
    if (typeof entry !== 'string' || entry.length === 0) {
      push(out, `${path}[${index}]`, 'expected a non-empty string');
    }
  });
}

/**
 * StatusModifierDefinition 的严格验证，覆盖全部修正 kind。
 */
function validateStatusModifier(
  value: unknown,
  path: string,
  out: SkillDefinitionValidationIssue[],
): void {
  const record = asRecord(value, path, out);
  if (record === null) return;
  const kind = requireString(record, 'kind', path, out);
  if (kind === null || !STATUS_MODIFIER_KINDS_SET.has(kind)) {
    if (kind !== null) push(out, `${path}.kind`, 'unknown status modifier kind');
    return;
  }

  switch (kind) {
    case 'attackPercent':
      validateLevelValues(record.value, `${path}.value`, out);
      break;
    case 'susceptibility':
      if (!Array.isArray(record.damageTypes) || record.damageTypes.length === 0) {
        push(out, `${path}.damageTypes`, 'expected a non-empty array');
      } else {
        record.damageTypes.forEach((damageType, index) => {
          if (typeof damageType !== 'string' || !DAMAGE_TYPES_SET.has(damageType)) {
            push(out, `${path}.damageTypes[${index}]`, 'unknown damage type');
          }
        });
      }
      validateLevelValues(record.value, `${path}.value`, out);
      if (record.attributeScaling !== undefined) {
        const scaling = asRecord(record.attributeScaling, `${path}.attributeScaling`, out);
        if (scaling !== null) {
          requireEnum(
            scaling,
            'attribute',
            OPERATOR_ATTRIBUTES_SET,
            `${path}.attributeScaling`,
            out,
          );
          validateLevelValues(scaling.coefficient, `${path}.attributeScaling.coefficient`, out);
        }
      }
      if (record.cap !== undefined) validateLevelValues(record.cap, `${path}.cap`, out);
      break;
    case 'blockResourceGain':
      requireEnum(record, 'resource', COMBAT_RESOURCES_SET, path, out);
      break;
    case 'resourceCostMultiplier':
      requireEnum(record, 'resource', COMBAT_RESOURCES_SET, path, out);
      requireFiniteNumber(record, 'value', path, out);
      break;
    case 'skillCooldownMultiplier':
      requireString(record, 'skillGroupKey', path, out);
      requireFiniteNumber(record, 'value', path, out);
      break;
    case 'slowed':
      break;
  }
}

/**
 * changeResource / changeResourceByActionValue 的资源变化元数据：
 * 校验 recipient 与资源互斥字段（sp 专属、ultimateEnergy 专属）。
 */
function validateResourceChangeMetadata(
  record: Record<string, unknown>,
  path: string,
  out: SkillDefinitionValidationIssue[],
): void {
  const resource = requireEnum(record, 'resource', COMBAT_RESOURCES_SET, path, out);
  requireEnum(record, 'recipient', RESOURCE_RECIPIENTS_SET, path, out);

  if (record.spGainKind !== undefined) {
    const kind = requireEnum(record, 'spGainKind', SP_GAIN_KINDS_SET, path, out);
    if (kind !== null && resource !== 'sp') {
      push(out, `${path}.spGainKind`, "is only valid when resource is 'sp'");
    }
  }
  if (record.spGainSource !== undefined) {
    const source = requireEnum(record, 'spGainSource', SP_GAIN_SOURCES_SET, path, out);
    if (source !== null && resource !== 'sp') {
      push(out, `${path}.spGainSource`, "is only valid when resource is 'sp'");
    }
  }
  for (const field of ['isPercentValue', 'ignoreUltimateEnergyGainMultiplier'] as const) {
    if (record[field] !== undefined) {
      requireBoolean(record, field, path, out);
      if (resource !== 'ultimateEnergy') {
        push(out, `${path}.${field}`, "is only valid when resource is 'ultimateEnergy'");
      }
    }
  }
  if (record.ultimateRecoveryTag !== undefined) {
    validateGameplayTag(record.ultimateRecoveryTag, `${path}.ultimateRecoveryTag`, out);
    if (resource !== 'ultimateEnergy') {
      push(out, `${path}.ultimateRecoveryTag`, "is only valid when resource is 'ultimateEnergy'");
    }
  }
}

/**
 * CombatStep 的严格验证，覆盖全部 kind 及其参数、互斥/条件字段。
 * dealDamage / dealFixedDamage 的非空 key 由调用方通过 collectDamageStepKeys 统一报告。
 */
function validateAbilityEntityChildSkill(
  value: unknown,
  path: string,
  out: SkillDefinitionValidationIssue[],
): void {
  const child = asRecord(value, path, out);
  if (child === null) return;
  requireString(child, 'skillId', path, out);
  if (child.blackboard !== undefined) {
    const blackboard = asRecord(child.blackboard, `${path}.blackboard`, out);
    if (blackboard !== null) {
      for (const [key, item] of Object.entries(blackboard)) {
        if (key.length === 0) push(out, `${path}.blackboard`, 'contains an empty key');
        validateLevelValues(item, `${path}.blackboard.${key}`, out);
      }
    }
  }
  if (!Array.isArray(child.scheduledSequences)) {
    push(out, `${path}.scheduledSequences`, 'expected an array');
  } else {
    child.scheduledSequences.forEach((sequence, index) =>
      validateScheduledSequence(sequence, `${path}.scheduledSequences[${index}]`, out, true),
    );
  }
}

function validateAbilityEntityPassiveSkill(
  value: unknown,
  path: string,
  out: SkillDefinitionValidationIssue[],
): void {
  const passive = asRecord(value, path, out);
  if (passive === null) return;
  requireString(passive, 'key', path, out);
  if (passive.blackboard !== undefined) {
    const blackboard = asRecord(passive.blackboard, `${path}.blackboard`, out);
    if (blackboard !== null) {
      for (const [key, item] of Object.entries(blackboard)) {
        if (key.length === 0) push(out, `${path}.blackboard`, 'contains an empty key');
        validateLevelValues(item, `${path}.blackboard.${JSON.stringify(key)}`, out);
      }
    }
  }
  // 能力实体被动以宿主实体作为 currentTarget；无需额外的 Context 迭代。
  validateActionSequence(passive.enableSequence, `${path}.enableSequence`, out, true);
  if (passive.abilityEventResponses === undefined) return;
  if (!Array.isArray(passive.abilityEventResponses)) {
    push(out, `${path}.abilityEventResponses`, 'expected an array');
    return;
  }
  passive.abilityEventResponses.forEach((value, index) => {
    const responsePath = `${path}.abilityEventResponses[${index}]`;
    const response = asRecord(value, responsePath, out);
    if (response === null) return;
    if (response.event !== 'addedBuff') {
      push(out, `${responsePath}.event`, "expected 'addedBuff'");
    }
    requireInteger(response, 'priority', responsePath, out);
    validateActionSequence(response.sequence, `${responsePath}.sequence`, out, true);
  });
}

/** 校验实体局部子技能；宿主实体上下文始终可用，区别于独立干员动作序列。 */
export function validateAbilityEntityChildSkillDefinition(
  value: unknown,
  path = '$',
): SkillDefinitionValidationIssue[] {
  const out: SkillDefinitionValidationIssue[] = [];
  validateAbilityEntityChildSkill(value, path, out);
  return out;
}

/** 严格验证可独立保存在干员层级的能力实体蓝图。 */
export function validateAbilityEntityDefinition(
  value: unknown,
  path = '$',
): SkillDefinitionValidationIssue[] {
  const out: SkillDefinitionValidationIssue[] = [];
  const definition = asRecord(value, path, out);
  if (definition === null) return out;
  if (definition.blackboard !== undefined) {
    const blackboard = asRecord(definition.blackboard, `${path}.blackboard`, out);
    if (blackboard !== null) {
      for (const [key, item] of Object.entries(blackboard)) {
        if (key.length === 0) push(out, `${path}.blackboard`, 'contains an empty key');
        if ((typeof item !== 'number' || !Number.isFinite(item)) && typeof item !== 'string') {
          push(
            out,
            `${path}.blackboard.${JSON.stringify(key)}`,
            'expected a finite number or string',
          );
        }
      }
    }
  }
  const lifetimePath = `${path}.lifetime`;
  const lifetime = asRecord(definition.lifetime, lifetimePath, out);
  if (lifetime !== null) {
    if (lifetime.kind !== 'limited' && lifetime.kind !== 'infinite') {
      push(out, `${lifetimePath}.kind`, "expected 'limited' or 'infinite'");
    } else if (lifetime.kind === 'limited') {
      validateAbilityEntityDefinitionNumber(
        lifetime.durationSeconds,
        `${lifetimePath}.durationSeconds`,
        out,
        false,
      );
    }
  }
  if (definition.childSkill !== undefined) {
    validateAbilityEntityChildSkill(definition.childSkill, `${path}.childSkill`, out);
  }
  if (definition.childSkills !== undefined) {
    const childSkills = asRecord(definition.childSkills, `${path}.childSkills`, out);
    if (childSkills !== null) {
      const entries = Object.entries(childSkills);
      if (entries.length === 0) {
        push(out, `${path}.childSkills`, 'expected at least one named child skill');
      }
      for (const [skillId, childSkill] of entries) {
        if (skillId.length === 0) {
          push(out, `${path}.childSkills`, 'contains an empty skill id');
        }
        validateAbilityEntityChildSkill(
          childSkill,
          `${path}.childSkills.${JSON.stringify(skillId)}`,
          out,
        );
        const record = asRecord(childSkill, `${path}.childSkills.${JSON.stringify(skillId)}`, []);
        if (record !== null && record.skillId !== skillId) {
          push(
            out,
            `${path}.childSkills.${JSON.stringify(skillId)}.skillId`,
            'must match the childSkills key',
          );
        }
      }
    }
  }
  if (definition.childSkill !== undefined && definition.childSkills !== undefined) {
    push(out, path, 'cannot define both childSkill and childSkills');
  }
  if (definition.passiveSkills !== undefined) {
    if (!Array.isArray(definition.passiveSkills)) {
      push(out, `${path}.passiveSkills`, 'expected an array');
    } else {
      const keys = new Set<string>();
      definition.passiveSkills.forEach((passive, index) => {
        const passivePath = `${path}.passiveSkills[${index}]`;
        validateAbilityEntityPassiveSkill(passive, passivePath, out);
        const record = asRecord(passive, passivePath, []);
        if (record === null || typeof record.key !== 'string') return;
        if (keys.has(record.key)) push(out, `${passivePath}.key`, `duplicate key '${record.key}'`);
        keys.add(record.key);
      });
    }
  }
  if (definition.deathReleaseDelaySeconds !== undefined) {
    const delay = requireFiniteNumber(definition, 'deathReleaseDelaySeconds', path, out);
    if (delay !== null && (delay < 0 || delay >= 300)) {
      push(out, `${path}.deathReleaseDelaySeconds`, 'expected a number in [0, 300)');
    }
  }
  if (definition.maxStackingCount !== undefined) {
    validateAbilityEntityDefinitionNumber(
      definition.maxStackingCount,
      `${path}.maxStackingCount`,
      out,
      true,
    );
  }
  return out;
}

function validateAbilityEntityDefinitionNumber(
  value: unknown,
  path: string,
  out: SkillDefinitionValidationIssue[],
  positiveInteger: boolean,
): void {
  const validateNumber = (candidate: unknown, candidatePath: string): void => {
    if (typeof candidate !== 'number' || !Number.isFinite(candidate)) {
      push(out, candidatePath, 'expected a finite number');
    } else if (positiveInteger ? !Number.isInteger(candidate) || candidate <= 0 : candidate < 0) {
      push(
        out,
        candidatePath,
        positiveInteger ? 'expected a positive integer' : 'expected a non-negative number',
      );
    }
  };
  if (typeof value === 'number') {
    validateNumber(value, path);
    return;
  }
  const operand = asRecord(value, path, out);
  if (operand === null) return;
  if (typeof operand.blackboardKey !== 'string' || operand.blackboardKey.length === 0) {
    push(out, `${path}.blackboardKey`, 'expected a non-empty string');
  }
  validateNumber(operand.fallback, `${path}.fallback`);
  for (const field of Object.keys(operand)) {
    if (field !== 'blackboardKey' && field !== 'fallback') {
      push(out, `${path}.${field}`, 'unexpected field');
    }
  }
}

function validateCombatStep(
  value: unknown,
  path: string,
  out: SkillDefinitionValidationIssue[],
  currentTargetAvailable = false,
): void {
  const record = asRecord(value, path, out);
  if (record === null) return;
  const kind = requireString(record, 'kind', path, out);
  if (kind === null || !STEP_KINDS.has(kind)) {
    if (kind !== null) push(out, `${path}.kind`, 'unknown combat step kind');
    return;
  }
  if (record.key !== undefined && typeof record.key !== 'string') {
    push(out, `${path}.key`, 'expected a string');
  }

  const parameters = asRecord(record.parameters, `${path}.parameters`, out);
  if (parameters === null) return;

  const requireTarget = (): void => {
    requireEnum(parameters, 'target', COMBAT_TARGETS_SET, `${path}.parameters`, out);
  };

  switch (kind) {
    case 'mergeContextTargets':
      requireString(parameters, 'saveToContextKey', `${path}.parameters`, out);
      if (!Array.isArray(parameters.sources)) {
        push(out, `${path}.parameters.sources`, 'expected an array');
      } else {
        parameters.sources.forEach((source, index) => {
          const sourcePath = `${path}.parameters.sources[${index}]`;
          const sourceRecord = asRecord(source, sourcePath, out);
          if (sourceRecord === null) return;
          const sourceKind = requireString(sourceRecord, 'kind', sourcePath, out);
          if (sourceKind === 'context') {
            requireString(sourceRecord, 'contextKey', sourcePath, out);
          } else if (sourceKind === 'abilitySystemSource') {
            const owner = requireString(sourceRecord, 'owner', sourcePath, out);
            if (owner !== null && owner !== 'actionSource' && owner !== 'actionOwner') {
              push(out, `${sourcePath}.owner`, 'unknown AbilitySystem source query owner');
            }
          } else if (sourceKind === 'target') {
            const target = requireString(sourceRecord, 'target', sourcePath, out);
            if (
              target !== null &&
              !['caster', 'enemy', 'eventTarget', 'buffSource', 'currentTarget'].includes(target)
            ) {
              push(out, `${sourcePath}.target`, 'unknown target source');
            }
          } else if (sourceKind !== null) {
            push(out, `${sourcePath}.kind`, 'unknown context target source');
          }
        });
      }
      break;
    case 'findCharacterTeamTargets': {
      requireString(parameters, 'saveToContextKey', `${path}.parameters`, out);
      const selectionPath = `${path}.parameters.selection`;
      const selection = asRecord(parameters.selection, selectionPath, out);
      if (selection !== null) {
        const selectionKind = requireString(selection, 'kind', selectionPath, out);
        if (
          selectionKind !== null &&
          selectionKind !== 'allOperators' &&
          selectionKind !== 'controlledOperator' &&
          selectionKind !== 'lowestHealthRatioOperator'
        ) {
          push(out, `${selectionPath}.kind`, 'unknown character-team selection');
        }
        if (selection.excludedContextKey !== undefined) {
          requireString(selection, 'excludedContextKey', selectionPath, out);
          if (selectionKind !== 'lowestHealthRatioOperator') {
            push(
              out,
              `${selectionPath}.excludedContextKey`,
              'only lowestHealthRatioOperator can exclude a context group',
            );
          }
        }
        if (selection.excludeCaster !== undefined) {
          if (selection.excludeCaster !== true) {
            push(out, `${selectionPath}.excludeCaster`, 'expected true');
          }
          if (selectionKind !== 'lowestHealthRatioOperator') {
            push(
              out,
              `${selectionPath}.excludeCaster`,
              'only lowestHealthRatioOperator can exclude the caster',
            );
          }
        }
        if (selection.excludeCurrentTarget !== undefined) {
          if (selection.excludeCurrentTarget !== true) {
            push(out, `${selectionPath}.excludeCurrentTarget`, 'expected true');
          }
          if (selectionKind !== 'lowestHealthRatioOperator') {
            push(
              out,
              `${selectionPath}.excludeCurrentTarget`,
              'only lowestHealthRatioOperator can exclude the current target',
            );
          }
        }
      }
      break;
    }
    case 'createSpatialPointTargets':
      requireString(parameters, 'saveToContextKey', `${path}.parameters`, out);
      validateActionValueOperand(parameters.count, `${path}.parameters.count`, out);
      break;
    case 'findOwnerSpawnedAbilityEntities': {
      requireString(parameters, 'saveToContextKey', `${path}.parameters`, out);
      if (parameters.ownerContextKey !== undefined) {
        requireString(parameters, 'ownerContextKey', `${path}.parameters`, out);
      }
      if (parameters.saveCountToBlackboardKey !== undefined) {
        requireString(parameters, 'saveCountToBlackboardKey', `${path}.parameters`, out);
      }
      if (parameters.abilityEntityIds !== undefined) {
        validateNonEmptyStringArray(
          parameters.abilityEntityIds,
          `${path}.parameters.abilityEntityIds`,
          out,
        );
      }
      if (parameters.sameSourceSkillCast !== undefined) {
        requireBoolean(parameters, 'sameSourceSkillCast', `${path}.parameters`, out);
      }
      if (parameters.maxTargets !== undefined) {
        requireNonNegativeInteger(parameters, 'maxTargets', `${path}.parameters`, out);
      }
      if (parameters.circularOrder !== undefined) {
        const orderPath = `${path}.parameters.circularOrder`;
        const order = asRecord(parameters.circularOrder, orderPath, out);
        if (order !== null) {
          requireString(order, 'indexBlackboardKey', orderPath, out);
          const desiredCount = requireNonNegativeInteger(order, 'desiredCount', orderPath, out);
          if (desiredCount === 0)
            push(out, `${orderPath}.desiredCount`, 'expected a positive integer');
          requireFiniteNumber(order, 'reverseFlag', orderPath, out);
        }
      }
      break;
    }
    case 'pickContextTarget':
      requireString(parameters, 'sourceContextKey', `${path}.parameters`, out);
      requireString(parameters, 'saveToContextKey', `${path}.parameters`, out);
      validateActionValueOperand(parameters.index, `${path}.parameters.index`, out);
      break;
    case 'forEachContextTarget':
      if (parameters.target === undefined) {
        requireString(parameters, 'contextKey', `${path}.parameters`, out);
      } else {
        requireEnum(parameters, 'target', new Set(['enemy', 'caster']), `${path}.parameters`, out);
        if (parameters.contextKey !== undefined) {
          push(out, `${path}.parameters.contextKey`, 'cannot be combined with target');
        }
      }
      break;
    case 'readAbilityEntityRemainingDuration':
      requireString(parameters, 'outputKey', `${path}.parameters`, out);
      if (!currentTargetAvailable) push(out, path, 'requires a forEachContextTarget body');
      break;
    case 'setAbilityEntityRemainingDuration':
      validateActionValueOperand(parameters.value, `${path}.parameters.value`, out);
      if (!currentTargetAvailable) push(out, path, 'requires a forEachContextTarget body');
      break;
    case 'finishCurrentAbilityEntity':
    case 'finishCurrentAbilityEntityWhenSourceDies':
      if (!currentTargetAvailable) push(out, path, 'requires a forEachContextTarget body');
      break;
    case 'finishActionOwnerAbilityEntity':
      break;
    case 'startCurrentAbilityEntityChildSkill':
      validateAbilityEntityChildSkill(parameters.childSkill, `${path}.parameters.childSkill`, out);
      if (!currentTargetAvailable) push(out, path, 'requires a forEachContextTarget body');
      break;
    case 'startCurrentAbilityEntityChildSkillById':
      requireString(parameters, 'childSkillId', `${path}.parameters`, out);
      if (!currentTargetAvailable) push(out, path, 'requires a forEachContextTarget body');
      break;
    case 'spawnAbilityEntity': {
      requireString(parameters, 'abilityEntityId', `${path}.parameters`, out);
      if (parameters.childSkillId !== undefined) {
        requireString(parameters, 'childSkillId', `${path}.parameters`, out);
      }
      const definitionPath = `${path}.parameters.definition`;
      const definition =
        parameters.definition === undefined
          ? null
          : asRecord(parameters.definition, definitionPath, out);
      if (definition !== null)
        out.push(...validateAbilityEntityDefinition(definition, definitionPath));
      if (parameters.inheritActionBlackboard !== undefined) {
        requireBoolean(parameters, 'inheritActionBlackboard', `${path}.parameters`, out);
      }
      if (parameters.target !== undefined) {
        if (parameters.target === 'currentAbilityEntity') {
          if (!currentTargetAvailable) push(out, path, 'requires a forEachContextTarget body');
        } else {
          requireTarget();
        }
      }
      if (parameters.overrideDurationSeconds !== undefined) {
        validateActionValueOperand(
          parameters.overrideDurationSeconds,
          `${path}.parameters.overrideDurationSeconds`,
          out,
        );
      }
      if (parameters.saveToContextKey !== undefined) {
        requireString(parameters, 'saveToContextKey', `${path}.parameters`, out);
      }
      requireBoolean(parameters, 'dieWhenSourceDies', `${path}.parameters`, out);
      if (parameters.finishByAction !== undefined) {
        requireBoolean(parameters, 'finishByAction', `${path}.parameters`, out);
      }
      if (parameters.blackboardAssignments !== undefined) {
        const assignments = asRecord(
          parameters.blackboardAssignments,
          `${path}.parameters.blackboardAssignments`,
          out,
        );
        if (assignments !== null) {
          for (const [key, operand] of Object.entries(assignments)) {
            if (key.length === 0) {
              push(out, `${path}.parameters.blackboardAssignments`, 'contains an empty key');
            }
            validateActionValueOperand(
              operand,
              `${path}.parameters.blackboardAssignments.${key}`,
              out,
            );
          }
        }
      }
      if (parameters.keywordEnhancements !== undefined) {
        const enhancementsPath = `${path}.parameters.keywordEnhancements`;
        if (!Array.isArray(parameters.keywordEnhancements)) {
          push(out, enhancementsPath, 'expected an array');
        } else {
          parameters.keywordEnhancements.forEach((value, index) => {
            const enhancementPath = `${enhancementsPath}[${index}]`;
            const enhancement = asRecord(value, enhancementPath, out);
            if (enhancement === null) return;
            if (
              !Array.isArray(enhancement.triggerBuffIds) ||
              enhancement.triggerBuffIds.length === 0
            ) {
              push(out, `${enhancementPath}.triggerBuffIds`, 'expected a non-empty array');
            } else {
              enhancement.triggerBuffIds.forEach((id, idIndex) => {
                if (typeof id !== 'string' || id.length === 0)
                  push(
                    out,
                    `${enhancementPath}.triggerBuffIds[${idIndex}]`,
                    'expected non-empty string',
                  );
              });
            }
            requireEnum(
              enhancement,
              'operation',
              new Set(['assign', 'add', 'multiply']),
              enhancementPath,
              out,
            );
            validateActionValueOperand(enhancement.value, `${enhancementPath}.value`, out);
          });
        }
      }
      if (parameters.stringBlackboardAssignments !== undefined) {
        const assignments = asRecord(
          parameters.stringBlackboardAssignments,
          `${path}.parameters.stringBlackboardAssignments`,
          out,
        );
        if (assignments !== null) {
          for (const [key, value] of Object.entries(assignments)) {
            if (key.trim().length === 0) {
              push(out, `${path}.parameters.stringBlackboardAssignments`, 'contains an empty key');
            }
            if (typeof value !== 'string' || value.trim().length === 0) {
              push(
                out,
                `${path}.parameters.stringBlackboardAssignments.${key}`,
                'expected a non-empty string',
              );
            }
          }
        }
      }
      if (parameters.copiedBlackboardAssignments !== undefined) {
        const assignments = asRecord(
          parameters.copiedBlackboardAssignments,
          `${path}.parameters.copiedBlackboardAssignments`,
          out,
        );
        if (assignments !== null) {
          for (const [key, value] of Object.entries(assignments)) {
            if (key.trim().length === 0) {
              push(out, `${path}.parameters.copiedBlackboardAssignments`, 'contains an empty key');
            }
            if (typeof value !== 'string' || value.trim().length === 0) {
              push(
                out,
                `${path}.parameters.copiedBlackboardAssignments.${key}`,
                'expected a non-empty source key',
              );
            }
          }
        }
      }
      break;
    }
    case 'applyElementalInfliction':
      requireEnum(parameters, 'element', INFLICTION_ELEMENTS_SET, `${path}.parameters`, out);
      requireBoolean(parameters, 'isExtra', `${path}.parameters`, out);
      if (
        parameters.target !== undefined &&
        !['enemy', 'buffOwner'].includes(parameters.target as string)
      ) {
        push(out, `${path}.parameters.target`, "expected 'enemy' or 'buffOwner'");
      }
      break;
    case 'applyKnockDown':
      if (parameters.target !== 'enemy') push(out, `${path}.parameters.target`, "expected 'enemy'");
      validateActionValueOperand(parameters.duration, `${path}.parameters.duration`, out);
      requireBoolean(parameters, 'force', `${path}.parameters`, out);
      requireBoolean(parameters, 'isExtra', `${path}.parameters`, out);
      requireEnum(
        parameters,
        'targetFilter',
        new Set(['aliveOnly', 'skipAll']),
        `${path}.parameters`,
        out,
      );
      requireEnum(
        parameters,
        'returnWhen',
        new Set(['always', 'successAndInterrupted', 'success', 'interrupted']),
        `${path}.parameters`,
        out,
      );
      break;
    case 'triggerSpellBurst':
      requireEnum(
        parameters,
        'burstType',
        new Set(['Fire', 'Pulse', 'Cryst', 'Natural']),
        `${path}.parameters`,
        out,
      );
      break;
    case 'applyElementalReaction':
      requireEnum(parameters, 'reaction', ELEMENTAL_REACTIONS_SET, `${path}.parameters`, out);
      requireTarget();
      validateLevelValuesOrActionValueOperand(
        parameters.durationSeconds,
        `${path}.parameters.durationSeconds`,
        out,
      );
      if (parameters.durationMultiplier !== undefined) {
        requireFiniteNumber(parameters, 'durationMultiplier', `${path}.parameters`, out);
      }
      requireFiniteNumber(parameters, 'effectiveness', `${path}.parameters`, out);
      break;
    case 'consumeElementalReaction':
      requireEnum(parameters, 'reaction', ELEMENTAL_REACTIONS_SET, `${path}.parameters`, out);
      if (parameters.target !== 'enemy') {
        push(out, `${path}.parameters.target`, "expected 'enemy'");
      }
      break;
    case 'dealDamage': {
      requireEnum(parameters, 'damageType', DAMAGE_TYPES_SET, `${path}.parameters`, out);
      if (parameters.calculation !== undefined) {
        requireEnum(parameters, 'calculation', DAMAGE_CALCULATIONS_SET, `${path}.parameters`, out);
      }
      validateLevelValuesOrActionValueOperand(
        parameters.attackScale,
        `${path}.parameters.attackScale`,
        out,
      );
      if (
        parameters.takeAttackSnapshot !== undefined &&
        typeof parameters.takeAttackSnapshot !== 'boolean'
      )
        push(out, `${path}.parameters.takeAttackSnapshot`, 'expected boolean');
      if (parameters.calculationMultiplier !== undefined) {
        validateLevelValues(
          parameters.calculationMultiplier,
          `${path}.parameters.calculationMultiplier`,
          out,
        );
        if (parameters.calculation !== 'breakingAttack') {
          push(
            out,
            `${path}.parameters.calculationMultiplier`,
            "requires calculation 'breakingAttack'",
          );
        }
      }
      validateDamageTags(parameters.tags, `${path}.parameters.tags`, out, false);
      if (parameters.gameplayTags !== undefined) {
        validateGameplayTags(parameters.gameplayTags, `${path}.parameters.gameplayTags`, out, true);
      }
      if (parameters.features !== undefined) {
        validateDamageFeatures(parameters.features, `${path}.parameters.features`, out);
      }
      if (parameters.stagger !== undefined) {
        validateLevelValuesOrActionValueOperand(
          parameters.stagger,
          `${path}.parameters.stagger`,
          out,
        );
      }
      if (parameters.staggerMultiplier !== undefined) {
        validateLevelValuesOrActionValueOperand(
          parameters.staggerMultiplier,
          `${path}.parameters.staggerMultiplier`,
          out,
        );
        if (parameters.stagger === undefined) {
          push(out, `${path}.parameters.staggerMultiplier`, 'requires stagger');
        }
      }
      if (
        parameters.staggerOnlyWhenCasterControlled !== undefined &&
        typeof parameters.staggerOnlyWhenCasterControlled !== 'boolean'
      ) {
        push(out, `${path}.parameters.staggerOnlyWhenCasterControlled`, 'expected boolean');
      }
      if (parameters.instantAttributeModifiers !== undefined) {
        if (!Array.isArray(parameters.instantAttributeModifiers)) {
          push(out, `${path}.parameters.instantAttributeModifiers`, 'expected array');
        } else {
          parameters.instantAttributeModifiers.forEach((rawModifier, index) => {
            const modifierPath = `${path}.parameters.instantAttributeModifiers[${index}]`;
            const modifier = asRecord(rawModifier, modifierPath, out);
            if (modifier === null) return;
            requireEnum(modifier, 'targetSide', DAMAGE_MODIFIER_SIDES_SET, modifierPath, out);
            requireString(modifier, 'attribute', modifierPath, out);
            requireEnum(modifier, 'slot', ATTRIBUTE_MODIFIER_SLOTS_SET, modifierPath, out);
            validateActionValueOperand(modifier.value, `${modifierPath}.value`, out);
            requireEnum(
              modifier,
              'attributeTiming',
              ATTRIBUTE_MODIFIER_TIMINGS_SET,
              modifierPath,
              out,
            );
          });
        }
      }
      if (parameters.instantDamageScaleModifiers !== undefined) {
        if (!Array.isArray(parameters.instantDamageScaleModifiers)) {
          push(out, `${path}.parameters.instantDamageScaleModifiers`, 'expected array');
        } else {
          parameters.instantDamageScaleModifiers.forEach((rawModifier, index) => {
            const modifierPath = `${path}.parameters.instantDamageScaleModifiers[${index}]`;
            const modifier = asRecord(rawModifier, modifierPath, out);
            if (modifier === null) return;
            requireEnum(modifier, 'side', DAMAGE_SCALE_SIDES_SET, modifierPath, out);
            requireEnum(modifier, 'zone', DAMAGE_SCALE_ZONES_SET, modifierPath, out);
            validateActionValueOperand(modifier.addition, `${modifierPath}.addition`, out);
          });
        }
      }
      if (parameters.attackScalePerStatusStack !== undefined) {
        const stack = asRecord(
          parameters.attackScalePerStatusStack,
          `${path}.parameters.attackScalePerStatusStack`,
          out,
        );
        if (stack !== null) {
          requireString(stack, 'statusKey', `${path}.parameters.attackScalePerStatusStack`, out);
          requireEnum(
            stack,
            'target',
            COMBAT_TARGETS_SET,
            `${path}.parameters.attackScalePerStatusStack`,
            out,
          );
          validateLevelValues(
            stack.coefficient,
            `${path}.parameters.attackScalePerStatusStack.coefficient`,
            out,
          );
        }
      }
      break;
    }
    case 'dealFixedDamage': {
      requireEnum(parameters, 'damageType', DAMAGE_TYPES_SET, `${path}.parameters`, out);
      validateLevelValuesOrActionValueOperand(parameters.value, `${path}.parameters.value`, out);
      validateDamageTags(parameters.tags, `${path}.parameters.tags`, out, false);
      if (parameters.features !== undefined) {
        validateDamageFeatures(parameters.features, `${path}.parameters.features`, out);
      }
      if (parameters.stagger !== undefined) {
        validateLevelValuesOrActionValueOperand(
          parameters.stagger,
          `${path}.parameters.stagger`,
          out,
        );
      }
      if (parameters.staggerMultiplier !== undefined) {
        validateLevelValuesOrActionValueOperand(
          parameters.staggerMultiplier,
          `${path}.parameters.staggerMultiplier`,
          out,
        );
        if (parameters.stagger === undefined) {
          push(out, `${path}.parameters.staggerMultiplier`, 'requires stagger');
        }
      }
      if (
        parameters.staggerOnlyWhenCasterControlled !== undefined &&
        typeof parameters.staggerOnlyWhenCasterControlled !== 'boolean'
      ) {
        push(out, `${path}.parameters.staggerOnlyWhenCasterControlled`, 'expected boolean');
      }
      break;
    }
    case 'dealStagger':
      validateLevelValuesOrActionValueOperand(parameters.value, `${path}.parameters.value`, out);
      if (parameters.valueMultiplier !== undefined) {
        validateLevelValuesOrActionValueOperand(
          parameters.valueMultiplier,
          `${path}.parameters.valueMultiplier`,
          out,
        );
      }
      break;
    case 'heal':
      requireEnum(parameters, 'target', HEAL_TARGETS_SET, `${path}.parameters`, out);
      if (parameters.source !== undefined && parameters.source !== 'buffOwner') {
        push(out, `${path}.parameters.source`, "expected 'buffOwner'");
      }
      if (parameters.target === 'contextTarget') {
        requireString(parameters, 'contextKey', `${path}.parameters`, out);
      } else if (parameters.contextKey !== undefined) {
        push(out, `${path}.parameters.contextKey`, 'requires target=contextTarget');
      }
      if (parameters.alwaysNext !== undefined) {
        requireBoolean(parameters, 'alwaysNext', `${path}.parameters`, out);
      }
      if (parameters.amount === undefined) {
        if (parameters.attributeSource !== undefined && parameters.attributeSource !== 'target') {
          push(out, `${path}.parameters.attributeSource`, "expected 'target'");
        }
        requireEnum(
          parameters,
          'attribute',
          HEAL_CALCULATION_ATTRIBUTES_SET,
          `${path}.parameters`,
          out,
        );
        validateLevelValuesOrActionValueOperand(
          parameters.multiplier,
          `${path}.parameters.multiplier`,
          out,
        );
        validateLevelValuesOrActionValueOperand(
          parameters.addition,
          `${path}.parameters.addition`,
          out,
        );
      } else {
        validateLevelValuesOrActionValueOperand(
          parameters.amount,
          `${path}.parameters.amount`,
          out,
        );
        for (const key of ['attribute', 'attributeSource', 'multiplier', 'addition'] as const) {
          if (parameters[key] !== undefined) {
            push(out, `${path}.parameters.${key}`, 'cannot be combined with definite amount');
          }
        }
      }
      validateGameplayTags(parameters.tags, `${path}.parameters.tags`, out, true);
      break;
    case 'applyBuff': {
      validateBuffApplication(parameters, path, out, currentTargetAvailable, {
        action: validateActionSequence,
        scheduled: validateScheduledSequence,
      });
      break;
    }
    case 'createGlobalBuff': {
      requireString(parameters, 'globalBuffId', `${path}.parameters`, out);
      if (parameters.count !== undefined) {
        validateActionValueOperand(parameters.count, `${path}.parameters.count`, out);
      }
      if (parameters.source !== undefined) {
        requireEnum(parameters, 'source', BUFF_APPLICATION_SOURCES_SET, `${path}.parameters`, out);
      }
      if (parameters.finishByAction !== undefined) {
        requireBoolean(parameters, 'finishByAction', `${path}.parameters`, out);
      }
      if (parameters.blackboardAssignments !== undefined) {
        const assignments = asRecord(
          parameters.blackboardAssignments,
          `${path}.parameters.blackboardAssignments`,
          out,
        );
        if (assignments !== null) {
          for (const [key, value] of Object.entries(assignments)) {
            validateActionValueOperand(
              value,
              `${path}.parameters.blackboardAssignments.${key}`,
              out,
            );
          }
        }
      }
      const definition = asRecord(parameters.definition, `${path}.parameters.definition`, out);
      if (definition !== null) {
        requireEnum(
          definition,
          'stackingType',
          new Set(['unlimited', 'stack']),
          `${path}.parameters.definition`,
          out,
        );
        if (definition.maxStackCount !== undefined) {
          const maximum = requireNonNegativeInteger(
            definition,
            'maxStackCount',
            `${path}.parameters.definition`,
            out,
          );
          if (maximum === 0)
            push(out, `${path}.parameters.definition.maxStackCount`, 'expected positive integer');
        }
        if (definition.durationSeconds !== undefined) {
          if (typeof definition.durationSeconds === 'number') {
            requireFiniteNumber(
              definition,
              'durationSeconds',
              `${path}.parameters.definition`,
              out,
            );
          } else {
            const duration = asRecord(
              definition.durationSeconds,
              `${path}.parameters.definition.durationSeconds`,
              out,
            );
            if (duration !== null)
              requireString(
                duration,
                'blackboardKey',
                `${path}.parameters.definition.durationSeconds`,
                out,
              );
          }
        }
        const blackboard = asRecord(
          definition.blackboard,
          `${path}.parameters.definition.blackboard`,
          out,
        );
        if (blackboard !== null) {
          for (const [key, value] of Object.entries(blackboard)) {
            if (typeof value !== 'number' && typeof value !== 'string' && value !== null) {
              push(out, `${path}.parameters.definition.blackboard.${key}`, 'invalid value');
            }
          }
        }
        if (definition.sharedSpModifiers !== undefined) {
          if (!Array.isArray(definition.sharedSpModifiers)) {
            push(out, `${path}.parameters.definition.sharedSpModifiers`, 'expected an array');
          } else {
            definition.sharedSpModifiers.forEach((value, index) => {
              const modifierPath = `${path}.parameters.definition.sharedSpModifiers[${index}]`;
              const modifier = asRecord(value, modifierPath, out);
              if (modifier === null) return;
              requireEnum(
                modifier,
                'attribute',
                new Set([
                  'spRecovery',
                  'gainEfficiency',
                  'normalAttackEfficiency',
                  'powerAttackEfficiency',
                ]),
                modifierPath,
                out,
              );
              requireEnum(
                modifier,
                'operation',
                new Set(['addition', 'multiplier']),
                modifierPath,
                out,
              );
              validateActionValueOperand(modifier.value, `${modifierPath}.value`, out);
              requireBoolean(modifier, 'applyToReturnSpGain', modifierPath, out);
            });
          }
        }
        if (!Array.isArray(definition.children) || definition.children.length === 0) {
          push(out, `${path}.parameters.definition.children`, 'expected a non-empty array');
        } else {
          definition.children.forEach((value, index) => {
            const childPath = `${path}.parameters.definition.children[${index}]`;
            const child = asRecord(value, childPath, out);
            if (child === null) return;
            requireString(child, 'buffId', childPath, out);
            const assignments = asRecord(
              child.blackboardAssignments,
              `${childPath}.blackboardAssignments`,
              out,
            );
            if (assignments !== null) {
              for (const [key, operand] of Object.entries(assignments)) {
                validateActionValueOperand(
                  operand,
                  `${childPath}.blackboardAssignments.${key}`,
                  out,
                );
              }
            }
          });
        }
      }
      break;
    }
    case 'finishParentGlobalBuff':
      requireEnum(parameters, 'reason', new Set(['early', 'other']), `${path}.parameters`, out);
      break;
    case 'finishGlobalBuffsById':
      if (!Array.isArray(parameters.globalBuffIds) || parameters.globalBuffIds.length === 0) {
        push(out, `${path}.parameters.globalBuffIds`, 'expected a non-empty array');
      } else {
        parameters.globalBuffIds.forEach((id, index) => {
          if (typeof id !== 'string' || id.length === 0) {
            push(out, `${path}.parameters.globalBuffIds[${index}]`, 'expected a non-empty string');
          }
        });
      }
      requireEnum(parameters, 'reason', new Set(['early', 'other']), `${path}.parameters`, out);
      break;
    case 'readSkillSettingData':
      if (!Array.isArray(parameters.items)) {
        push(out, `${path}.parameters.items`, 'expected an array');
      } else {
        parameters.items.forEach((value, index) => {
          const itemPath = `${path}.parameters.items[${index}]`;
          const item = asRecord(value, itemPath, out);
          if (item === null) return;
          if (!Array.isArray(item.values) || item.values.length !== 4) {
            push(out, `${itemPath}.values`, 'expected four columns');
          } else {
            item.values.forEach((entry, column) => {
              if (typeof entry !== 'number' || !Number.isFinite(entry)) {
                push(out, `${itemPath}.values[${column}]`, 'expected finite number');
              }
            });
          }
          validateActionValueOperand(item.column, `${itemPath}.column`, out);
          requireString(item, 'storeKey', itemPath, out);
          if (item.enhance !== undefined) {
            const enhance = asRecord(item.enhance, `${itemPath}.enhance`, out);
            if (enhance !== null) {
              requireEnum(
                enhance,
                'target',
                new Set(['caster', 'buffOwner', 'buffSource']),
                `${itemPath}.enhance`,
                out,
              );
              const formula = asRecord(enhance.formula, `${itemPath}.enhance.formula`, out);
              if (formula !== null) {
                requireEnum(
                  formula,
                  'kind',
                  new Set(['linear', 'saturating']),
                  `${itemPath}.enhance.formula`,
                  out,
                );
                requireFiniteNumber(formula, 'paramA', `${itemPath}.enhance.formula`, out);
                if (formula.kind === 'saturating')
                  requireFiniteNumber(formula, 'paramB', `${itemPath}.enhance.formula`, out);
              }
            }
          }
        });
      }
      break;
    case 'applyPhysicalInfliction': {
      if (
        parameters.type !== 'fracture' &&
        parameters.type !== 'crush' &&
        parameters.type !== 'airborne'
      ) {
        push(out, `${path}.parameters.type`, "expected 'fracture', 'crush', or 'airborne'");
      }
      if (parameters.target !== 'enemy') {
        push(out, `${path}.parameters.target`, "expected 'enemy'");
      }
      requireBoolean(parameters, 'isExtra', `${path}.parameters`, out);
      const noGuardBuffId = requireString(parameters, 'noGuardBuffId', `${path}.parameters`, out);
      const statusBuffId =
        parameters.type === 'crush'
          ? requireString(parameters, 'crushedBuffId', `${path}.parameters`, out)
          : parameters.type === 'airborne'
            ? requireString(parameters, 'airborneBuffId', `${path}.parameters`, out)
            : requireString(parameters, 'fractureBuffId', `${path}.parameters`, out);
      const statusDefinitionKey =
        parameters.type === 'crush'
          ? 'crushedDefinition'
          : parameters.type === 'airborne'
            ? 'airborneDefinition'
            : 'fractureDefinition';
      if (parameters.type === 'crush') {
        validateActionValueOperand(
          parameters.damageMultiplier,
          `${path}.parameters.damageMultiplier`,
          out,
        );
        requireBoolean(parameters, 'ignoreHitEffect', `${path}.parameters`, out);
      }
      if (parameters.type === 'airborne') {
        validateActionValueOperand(parameters.duration, `${path}.parameters.duration`, out);
        validateActionValueOperand(parameters.height, `${path}.parameters.height`, out);
        requireFiniteNumber(parameters, 'speedFactorMultiplier', `${path}.parameters`, out);
        requireBoolean(parameters, 'force', `${path}.parameters`, out);
        requireEnum(
          parameters,
          'targetFilter',
          new Set(['aliveOnly', 'skipAll']),
          `${path}.parameters`,
          out,
        );
        requireEnum(
          parameters,
          'returnWhen',
          new Set(['always', 'successAndInterrupted', 'success', 'interrupted']),
          `${path}.parameters`,
          out,
        );
      }
      for (const [definitionKey, buffId] of [
        ['noGuardDefinition', noGuardBuffId],
        [statusDefinitionKey, statusBuffId],
      ] as const) {
        if (buffId === null) continue;
        validateCombatStep(
          {
            kind: 'applyBuff',
            parameters: {
              buffId,
              definition: parameters[definitionKey],
              target: 'enemy',
              inheritSourceSkillCastInfo: true,
            },
          },
          `${path}.parameters.${definitionKey}`,
          out,
          currentTargetAvailable,
        );
      }
      break;
    }
    case 'readEventBuffBlackboard':
      requireString(parameters, 'desiredKey', `${path}.parameters`, out);
      requireString(parameters, 'outputKey', `${path}.parameters`, out);
      break;
    case 'readCurrentBuffRemainingDuration':
      requireString(parameters, 'outputKey', `${path}.parameters`, out);
      break;
    case 'readBuffRemainingDuration':
      requireEnum(parameters, 'target', BUFF_SINGLE_TARGETS_SET, `${path}.parameters`, out);
      validateNonEmptyStringArray(parameters.buffIds, `${path}.parameters.buffIds`, out);
      requireString(parameters, 'outputKey', `${path}.parameters`, out);
      break;
    case 'setCurrentBuffRemainingDuration':
      requireEnum(
        parameters,
        'operation',
        new Set(['assign', 'add', 'multiply']),
        `${path}.parameters`,
        out,
      );
      validateActionValueOperand(parameters.value, `${path}.parameters.value`, out);
      break;
    case 'refreshCurrentBuffAttributeModifiers':
      break;
    case 'readBuffBlackboard':
    case 'readBuffStackCount': {
      // Buff 事件序列可从事件载荷解析 eventTarget；普通技能步骤仍会在运行时缺少
      // 对应事件上下文时失败关闭。这里按公开类型校验单体 Buff 目标，不误缩成战斗目标。
      requireEnum(parameters, 'target', BUFF_SINGLE_TARGETS_SET, `${path}.parameters`, out);
      requireString(parameters, 'outputKey', `${path}.parameters`, out);
      if (kind === 'readBuffBlackboard') {
        requireString(parameters, 'desiredKey', `${path}.parameters`, out);
      }
      if (parameters.sameSourceSkillCast !== undefined) {
        requireBoolean(parameters, 'sameSourceSkillCast', `${path}.parameters`, out);
      }
      if (kind === 'readBuffStackCount' && parameters.countType !== undefined) {
        requireEnum(
          parameters,
          'countType',
          new Set(['enhance', 'instance']),
          `${path}.parameters`,
          out,
        );
      }
      const query = asRecord(parameters.query, `${path}.parameters.query`, out);
      if (query === null) break;
      const queryKind = requireString(query, 'kind', `${path}.parameters.query`, out);
      if (queryKind === 'id') {
        validateNonEmptyStringArray(query.buffIds, `${path}.parameters.query.buffIds`, out);
      } else if (queryKind === 'tag') {
        requireEnum(query, 'tagQueryType', TAG_QUERY_TYPES_SET, `${path}.parameters.query`, out);
        validateGameplayTags(query.buffTags, `${path}.parameters.query.buffTags`, out);
      } else if (queryKind === 'environment' && kind !== 'readBuffStackCount') {
        push(out, `${path}.parameters.query.kind`, 'environment is only valid for stack count');
      } else if (queryKind !== 'environment' && queryKind !== null) {
        push(out, `${path}.parameters.query.kind`, "expected 'id', 'tag', or 'environment'");
      }
      if (
        kind === 'readBuffStackCount' &&
        queryKind === 'environment' &&
        parameters.countType === 'instance'
      ) {
        push(
          out,
          `${path}.parameters.countType`,
          'environment query only exposes the current Buff enhance count',
        );
      }
      break;
    }
    case 'finishBuffsByTag':
      requireEnum(
        parameters,
        'target',
        new Set(BUFF_TAG_FINISH_TARGETS),
        `${path}.parameters`,
        out,
      );
      requireEnum(parameters, 'tagQueryType', TAG_QUERY_TYPES_SET, `${path}.parameters`, out);
      validateGameplayTags(parameters.buffTags, `${path}.parameters.buffTags`, out);
      requireEnum(parameters, 'reason', BUFF_FINISH_REASONS_SET, `${path}.parameters`, out);
      if (parameters.count !== undefined) {
        validateActionValueOperand(parameters.count, `${path}.parameters.count`, out);
      }
      break;
    case 'finishBuffsById':
      requireEnum(
        parameters,
        'target',
        new Set(BUFF_APPLICATION_TARGETS),
        `${path}.parameters`,
        out,
      );
      validateNonEmptyStringArray(parameters.buffIds, `${path}.parameters.buffIds`, out);
      requireEnum(parameters, 'reason', BUFF_FINISH_REASONS_SET, `${path}.parameters`, out);
      if (parameters.count !== undefined) {
        validateActionValueOperand(parameters.count, `${path}.parameters.count`, out);
      }
      break;
    case 'skillAffix':
      break;
    case 'finishCurrentBuff':
      requireEnum(parameters, 'reason', BUFF_FINISH_REASONS_SET, `${path}.parameters`, out);
      requireEnum(
        parameters,
        'finishSource',
        new Set(['actionSource', 'actionOwner']),
        `${path}.parameters`,
        out,
      );
      break;
    case 'setCurrentBuffTimePaused':
      requireBoolean(parameters, 'paused', `${path}.parameters`, out);
      break;
    case 'igniteBuffs':
      requireEnum(parameters, 'target', BUFF_SINGLE_TARGETS_SET, `${path}.parameters`, out);
      requireEnum(
        parameters,
        'source',
        new Set([...BUFF_SINGLE_TARGETS, 'currentBuffSource']),
        `${path}.parameters`,
        out,
      );
      requireString(parameters, 'igniteType', `${path}.parameters`, out);
      break;
    case 'adjustSkillCooldown':
      if (parameters.target !== 'caster') {
        push(out, `${path}.parameters.target`, "expected 'caster'");
      }
      {
        const skill = asRecord(parameters.skill, `${path}.parameters.skill`, out);
        if (skill !== null) {
          if (skill.kind === 'type') {
            requireEnum(skill, 'skillType', SKILL_TYPES_SET, `${path}.parameters.skill`, out);
          } else if (skill.kind === 'id') {
            requireString(skill, 'skillId', `${path}.parameters.skill`, out);
          } else {
            push(out, `${path}.parameters.skill.kind`, "expected 'type' or 'id'");
          }
        }
      }
      if (parameters.operation !== 'reduce' && parameters.operation !== 'set') {
        push(out, `${path}.parameters.operation`, "expected 'reduce' or 'set'");
      }
      if (parameters.basis !== 'baseDurationRatio' && parameters.basis !== 'absoluteSeconds') {
        push(out, `${path}.parameters.basis`, "expected 'baseDurationRatio' or 'absoluteSeconds'");
      }
      if (parameters.operation === 'reduce' && parameters.basis === 'absoluteSeconds') {
        push(out, `${path}.parameters.basis`, "absoluteSeconds is unsupported for 'reduce'");
      }
      validateActionValueOperand(parameters.value, `${path}.parameters.value`, out);
      break;
    case 'outputAirborne':
    case 'outputKnockDown':
      requireTarget();
      break;
    case 'holdBuffsById':
      if (parameters.target !== 'caster') {
        push(out, `${path}.parameters.target`, "expected 'caster'");
      }
      validateNonEmptyStringArray(parameters.buffIds, `${path}.parameters.buffIds`, out);
      break;
    case 'inheritBuffById':
      if (parameters.target !== 'caster') {
        push(out, `${path}.parameters.target`, "expected 'caster'");
      }
      requireString(parameters, 'buffId', `${path}.parameters`, out);
      validateStringArray(
        parameters.inheritToNextSkillIds,
        `${path}.parameters.inheritToNextSkillIds`,
        out,
      );
      requireBoolean(parameters, 'finishByAction', `${path}.parameters`, out);
      requireBoolean(parameters, 'finishWithNextSkillIfNotInherited', `${path}.parameters`, out);
      break;
    case 'restrictUltimateEnergyRecovery':
      if (parameters.target !== 'caster') {
        push(out, `${path}.parameters.target`, "expected 'caster'");
      }
      validateGameplayTags(
        parameters.allowedRecoveryTags,
        `${path}.parameters.allowedRecoveryTags`,
        out,
        true,
      );
      requireBoolean(parameters, 'clearUltimateEnergyOnEnd', `${path}.parameters`, out);
      break;
    case 'setGlobalCooldown':
      requireEnum(
        parameters,
        'target',
        new Set(GLOBAL_COOLDOWN_TARGETS),
        `${path}.parameters`,
        out,
      );
      requireString(parameters, 'markerId', `${path}.parameters`, out);
      validateActionValueOperand(
        parameters.durationSeconds,
        `${path}.parameters.durationSeconds`,
        out,
      );
      break;
    case 'createTimedMarker':
      requireEnum(parameters, 'target', TIMED_MARKER_TARGETS_SET, `${path}.parameters`, out);
      validateActionStringOperand(parameters.markerId, `${path}.parameters.markerId`, out);
      validateActionValueOperand(
        parameters.durationSeconds,
        `${path}.parameters.durationSeconds`,
        out,
      );
      requireBoolean(parameters, 'autoFinishByAction', `${path}.parameters`, out);
      if (parameters.timeDomain !== undefined)
        requireEnum(parameters, 'timeDomain', new Set(['globalScaled']), `${path}.parameters`, out);
      break;
    case 'createAbilityEntityTimedMarker':
      validateActionStringOperand(parameters.markerId, `${path}.parameters.markerId`, out);
      validateActionValueOperand(
        parameters.durationSeconds,
        `${path}.parameters.durationSeconds`,
        out,
      );
      requireBoolean(parameters, 'autoFinishByAction', `${path}.parameters`, out);
      requireEnum(parameters, 'timeDomain', new Set(['global', 'self']), `${path}.parameters`, out);
      break;
    case 'startTimeDilation': {
      const parameterPath = `${path}.parameters`;
      const scope = requireEnum(
        parameters,
        'scope',
        new Set(['global', 'entity']),
        parameterPath,
        out,
      );
      validateActionValueOperand(
        parameters.durationSeconds,
        `${parameterPath}.durationSeconds`,
        out,
      );
      validateGameplayTag(parameters.slot, `${parameterPath}.slot`, out);
      requireInteger(parameters, 'priority', parameterPath, out);
      validateTimeScaleCurve(parameters.curve, `${parameterPath}.curve`, out);
      requireBoolean(parameters, 'finishByAction', parameterPath, out);
      if (scope === 'global') {
        validateCombatTargetArray(
          parameters.ignoredTargets,
          `${parameterPath}.ignoredTargets`,
          out,
          true,
          TIME_DILATION_IGNORE_TARGETS_SET,
        );
        if (parameters.ignoredAbilityEntityTargets !== undefined) {
          validateAbilityEntityTargetQueries(
            parameters.ignoredAbilityEntityTargets,
            `${parameterPath}.ignoredAbilityEntityTargets`,
            out,
          );
        }
        if (parameters.influenceSkillCooldownSeconds !== undefined) {
          validateActionValueOperand(
            parameters.influenceSkillCooldownSeconds,
            `${parameterPath}.influenceSkillCooldownSeconds`,
            out,
          );
        }
      } else if (scope === 'entity') {
        const hasAbilityEntityTargets =
          parameters.abilityEntityTargets === undefined
            ? false
            : validateAbilityEntityTargetQueries(
                parameters.abilityEntityTargets,
                `${parameterPath}.abilityEntityTargets`,
                out,
              );
        validateCombatTargetArray(
          parameters.targets,
          `${parameterPath}.targets`,
          out,
          hasAbilityEntityTargets,
          TIME_DILATION_ENTITY_TARGETS_SET,
        );
        if (parameters.ignoreSlotCheck !== undefined) {
          requireBoolean(parameters, 'ignoreSlotCheck', parameterPath, out);
        }
      }
      break;
    }
    case 'hideUi':
      requireBoolean(parameters, 'onlyBlockInput', `${path}.parameters`, out);
      break;
    case 'startUltimateTimeDilation': {
      const parameterPath = `${path}.parameters`;
      requireInteger(parameters, 'priority', parameterPath, out);
      validateActionValueOperand(parameters.targetScale, `${parameterPath}.targetScale`, out);
      validateCombatTargetArray(
        parameters.ignoredTargets,
        `${parameterPath}.ignoredTargets`,
        out,
        true,
        TIME_DILATION_IGNORE_TARGETS_SET,
      );
      if (parameters.ignoredAbilityEntityTargets !== undefined) {
        validateAbilityEntityTargetQueries(
          parameters.ignoredAbilityEntityTargets,
          `${parameterPath}.ignoredAbilityEntityTargets`,
          out,
        );
      }
      break;
    }
    case 'setIgnoreGlobalTimeScale': {
      const parameterPath = `${path}.parameters`;
      validateAbilityEntityTargetQueries(
        parameters.abilityEntityTargets,
        `${parameterPath}.abilityEntityTargets`,
        out,
      );
      requireBoolean(parameters, 'ignore', parameterPath, out);
      requireBoolean(parameters, 'revertOnEnd', parameterPath, out);
      break;
    }
    case 'storeCurrentTimelineFrame':
      requireString(parameters, 'outputKey', `${path}.parameters`, out);
      break;
    case 'storeEventSpGainAmount':
      if (parameters.outputKey === undefined && parameters.realDeltaOutputKey === undefined) {
        push(out, `${path}.parameters`, 'requires outputKey or realDeltaOutputKey');
        break;
      }
      if (parameters.outputKey !== undefined) {
        requireString(parameters, 'outputKey', `${path}.parameters`, out);
      }
      if (parameters.realDeltaOutputKey !== undefined) {
        requireString(parameters, 'realDeltaOutputKey', `${path}.parameters`, out);
      }
      break;
    case 'storeEventHealValues':
      if (
        parameters.finalHealOutputKey === undefined &&
        parameters.realHealOutputKey === undefined
      ) {
        push(out, `${path}.parameters`, 'requires finalHealOutputKey or realHealOutputKey');
        break;
      }
      if (parameters.finalHealOutputKey !== undefined) {
        requireString(parameters, 'finalHealOutputKey', `${path}.parameters`, out);
      }
      if (parameters.realHealOutputKey !== undefined) {
        requireString(parameters, 'realHealOutputKey', `${path}.parameters`, out);
      }
      break;
    case 'storeShieldValue':
      requireEnum(parameters, 'target', new Set(['actionOwner']), `${path}.parameters`, out);
      requireEnum(parameters, 'value', new Set(['gained', 'current']), `${path}.parameters`, out);
      requireString(parameters, 'outputKey', `${path}.parameters`, out);
      break;
    case 'modifyActionValue':
      requireString(parameters, 'key', `${path}.parameters`, out);
      requireEnum(parameters, 'operation', ACTION_VALUE_OPERATIONS_SET, `${path}.parameters`, out);
      validateActionValueOperand(parameters.value, `${path}.parameters.value`, out);
      break;
    case 'calculateActionValue':
      requireString(parameters, 'key', `${path}.parameters`, out);
      requireEnum(
        parameters,
        'operation',
        ACTION_VALUE_CALCULATION_OPERATIONS_SET,
        `${path}.parameters`,
        out,
      );
      validateActionValueOperand(parameters.left, `${path}.parameters.left`, out);
      validateActionValueOperand(parameters.right, `${path}.parameters.right`, out);
      break;
    case 'storeSourceAttributeValue': {
      const parameterPath = `${path}.parameters`;
      const attribute = asRecord(parameters.attribute, `${parameterPath}.attribute`, out);
      if (attribute !== null) {
        const attributeKind = requireString(attribute, 'kind', `${parameterPath}.attribute`, out);
        if (attributeKind === 'specific') {
          requireString(attribute, 'key', `${parameterPath}.attribute`, out);
        } else if (!['main', 'secondary', 'all'].includes(attributeKind ?? '')) {
          push(out, `${parameterPath}.attribute.kind`, 'unknown attribute selection kind');
        }
      }
      requireEnum(
        parameters,
        'stage',
        new Set(['armedNonConverted', 'finalNonConverted']),
        parameterPath,
        out,
      );
      requireBoolean(parameters, 'useFloor', parameterPath, out);
      validateActionValueOperand(parameters.divisor, `${parameterPath}.divisor`, out);
      validateActionValueOperand(parameters.multiplier, `${parameterPath}.multiplier`, out);
      validateActionValueOperand(parameters.base, `${parameterPath}.base`, out);
      requireString(parameters, 'targetKey', parameterPath, out);
      break;
    }
    case 'storeEntityPropertyValue': {
      const parameterPath = `${path}.parameters`;
      requireEnum(parameters, 'target', new Set(['actionOwner']), parameterPath, out);
      requireEnum(
        parameters,
        'property',
        new Set(['currentHealth', 'maxHealth', 'currentPoise']),
        parameterPath,
        out,
      );
      requireBoolean(parameters, 'useFloor', parameterPath, out);
      validateActionValueOperand(parameters.divisor, `${parameterPath}.divisor`, out);
      validateActionValueOperand(parameters.multiplier, `${parameterPath}.multiplier`, out);
      validateActionValueOperand(parameters.base, `${parameterPath}.base`, out);
      requireString(parameters, 'targetKey', parameterPath, out);
      break;
    }
    case 'setHealthFloor': {
      const parameterPath = `${path}.parameters`;
      requireEnum(parameters, 'target', new Set(['actionOwner']), parameterPath, out);
      requireEnum(parameters, 'mode', new Set(['absolute', 'maxHealthRatio']), parameterPath, out);
      validateActionValueOperand(parameters.value, `${parameterPath}.value`, out);
      break;
    }
    case 'changeResource':
      validateLevelValues(parameters.amount, `${path}.parameters.amount`, out);
      if (parameters.coefficient !== undefined) {
        validateLevelValues(parameters.coefficient, `${path}.parameters.coefficient`, out);
      }
      validateResourceChangeMetadata(parameters, `${path}.parameters`, out);
      break;
    case 'changeResourceByActionValue':
      validateActionValueOperand(parameters.amount, `${path}.parameters.amount`, out);
      if (parameters.coefficient !== undefined) {
        validateLevelValuesOrActionValueOperand(
          parameters.coefficient,
          `${path}.parameters.coefficient`,
          out,
        );
      }
      validateResourceChangeMetadata(parameters, `${path}.parameters`, out);
      break;
    case 'gainSquadUltimateEnergyFromSkillCost':
      validateLevelValues(parameters.coefficient, `${path}.parameters.coefficient`, out);
      break;
    case 'gainFinisherSp':
      requireFiniteNumber(parameters, 'factor', `${path}.parameters`, out);
      if (parameters.recipient !== 'team') {
        push(out, `${path}.parameters.recipient`, "expected 'team'");
      }
      break;
    case 'applyStatus':
      requireString(parameters, 'statusKey', `${path}.parameters`, out);
      requireTarget();
      if (parameters.durationFrames !== undefined) {
        validateLevelValues(parameters.durationFrames, `${path}.parameters.durationFrames`, out);
      }
      if (parameters.stacks !== undefined) {
        requireNonNegativeInteger(parameters, 'stacks', `${path}.parameters`, out);
      }
      if (parameters.maxStacks !== undefined) {
        requireNonNegativeInteger(parameters, 'maxStacks', `${path}.parameters`, out);
      }
      if (parameters.modifiers !== undefined) {
        if (!Array.isArray(parameters.modifiers)) {
          push(out, `${path}.parameters.modifiers`, 'expected an array');
        } else {
          parameters.modifiers.forEach((modifier, index) => {
            validateStatusModifier(modifier, `${path}.parameters.modifiers[${index}]`, out);
          });
        }
      }
      break;
    case 'consumeStatus':
      requireString(parameters, 'statusKey', `${path}.parameters`, out);
      requireTarget();
      if (parameters.stacks !== undefined) {
        requireNonNegativeInteger(parameters, 'stacks', `${path}.parameters`, out);
      }
      break;
    case 'jumpTimeline':
      requireNonNegativeInteger(parameters, 'destinationFrame', `${path}.parameters`, out);
      if (parameters.condition !== undefined) {
        validateCombatCondition(
          parameters.condition,
          `${path}.parameters.condition`,
          out,
          currentTargetAvailable,
        );
      }
      break;
    case 'finishTimeline':
      break;
    case 'markCurrentSkillCanDash':
      break;
    case 'reachSkillOperableBoundary':
      if (!Array.isArray(parameters.skillIds) || parameters.skillIds.length === 0) {
        push(out, `${path}.parameters.skillIds`, 'expected a non-empty array');
      } else {
        parameters.skillIds.forEach((skillId, index) => {
          if (typeof skillId !== 'string' || skillId.length === 0) {
            push(out, `${path}.parameters.skillIds[${index}]`, 'expected a non-empty string');
          }
        });
      }
      break;
    case 'switch':
      validateActionValueOperand(parameters.choice, `${path}.parameters.choice`, out);
      requireBoolean(parameters, 'alwaysNext', `${path}.parameters`, out);
      break;
    case 'conditional':
      validateCombatCondition(
        parameters.condition,
        `${path}.parameters.condition`,
        out,
        currentTargetAvailable,
      );
      if (parameters.alwaysNext !== undefined && typeof parameters.alwaysNext !== 'boolean') {
        push(out, `${path}.parameters.alwaysNext`, 'expected a boolean');
      }
      break;
    case 'once':
      requireString(parameters, 'scopeKey', `${path}.parameters`, out);
      break;
    case 'withActionBlackboardScope': {
      requireString(parameters, 'scopeKey', `${path}.parameters`, out);
      if (parameters.alwaysNext !== undefined && typeof parameters.alwaysNext !== 'boolean') {
        push(out, `${path}.parameters.alwaysNext`, 'expected a boolean');
      }
      if (
        parameters.shareParentBlackboard !== undefined &&
        typeof parameters.shareParentBlackboard !== 'boolean'
      ) {
        push(out, `${path}.parameters.shareParentBlackboard`, 'expected a boolean');
      }
      if (
        parameters.lifetime !== undefined &&
        parameters.lifetime !== 'parent' &&
        parameters.lifetime !== 'execution'
      ) {
        push(out, `${path}.parameters.lifetime`, "expected 'parent' or 'execution'");
      }
      const initialValues = asRecord(
        parameters.initialValues,
        `${path}.parameters.initialValues`,
        out,
      );
      if (initialValues !== null) {
        Object.entries(initialValues).forEach(([key, value]) =>
          validateLevelValues(value, `${path}.parameters.initialValues.${key}`, out),
        );
      }
      if (typeof parameters.inheritParent !== 'boolean') {
        push(out, `${path}.parameters.inheritParent`, 'expected a boolean');
      }
      if (parameters.entityInitialValues !== undefined) {
        const entityInitialValues = asRecord(
          parameters.entityInitialValues,
          `${path}.parameters.entityInitialValues`,
          out,
        );
        if (entityInitialValues !== null) {
          Object.entries(entityInitialValues).forEach(([key, value]) => {
            if (!key.startsWith('EntityBB_')) {
              push(
                out,
                `${path}.parameters.entityInitialValues.${key}`,
                "expected an 'EntityBB_' key",
              );
            }
            validateLevelValues(value, `${path}.parameters.entityInitialValues.${key}`, out);
          });
        }
      }
      if (parameters.entityAssignments !== undefined) {
        const entityAssignments = asRecord(
          parameters.entityAssignments,
          `${path}.parameters.entityAssignments`,
          out,
        );
        if (entityAssignments !== null) {
          Object.entries(entityAssignments).forEach(([key, value]) => {
            if (!key.startsWith('EntityBB_')) {
              push(
                out,
                `${path}.parameters.entityAssignments.${key}`,
                "expected an 'EntityBB_' key",
              );
            }
            validateActionValueOperand(value, `${path}.parameters.entityAssignments.${key}`, out);
          });
        }
      }
      if (parameters.shareParentBlackboard === true) {
        if (initialValues !== null && Object.keys(initialValues).length !== 0) {
          push(
            out,
            `${path}.parameters.initialValues`,
            'expected no initial values when sharing the parent blackboard',
          );
        }
        if (parameters.inheritParent !== true) {
          push(
            out,
            `${path}.parameters.inheritParent`,
            'expected true when sharing the parent blackboard',
          );
        }
        if (parameters.entityInitialValues !== undefined) {
          push(
            out,
            `${path}.parameters.entityInitialValues`,
            'expected no entity initial values when sharing the parent blackboard',
          );
        }
        if (parameters.entityAssignments !== undefined) {
          push(
            out,
            `${path}.parameters.entityAssignments`,
            'expected no entity assignments when sharing the parent blackboard',
          );
        }
      }
      break;
    }
    case 'repeatEachTick': {
      if (
        parameters.nativeChanneling !== undefined &&
        parameters.nativeTickInterval !== undefined
      ) {
        push(out, `${path}.parameters`, 'nativeChanneling and nativeTickInterval are exclusive');
      }
      if (parameters.nativeChanneling !== undefined) {
        const channelingPath = `${path}.parameters.nativeChanneling`;
        const channeling = asRecord(parameters.nativeChanneling, channelingPath, out);
        if (channeling !== null) {
          const executeEachFrame = requireBoolean(
            channeling,
            'executeEachFrame',
            channelingPath,
            out,
          );
          const interval = requireFiniteNumber(
            channeling,
            'triggerIntervalSeconds',
            channelingPath,
            out,
          );
          if (executeEachFrame === false && interval !== null && interval <= 0) {
            push(out, `${channelingPath}.triggerIntervalSeconds`, 'expected a positive number');
          }
          const maxCount = requireInteger(channeling, 'maxCountPerTarget', channelingPath, out);
          if (maxCount !== null && maxCount < -1) {
            push(
              out,
              `${channelingPath}.maxCountPerTarget`,
              'expected -1 or a non-negative integer',
            );
          }
          requireFiniteNumber(channeling, 'targetTriggerIntervalSeconds', channelingPath, out);
        }
      }
      if (parameters.nativeTickInterval !== undefined) {
        const tickPath = `${path}.parameters.nativeTickInterval`;
        const tick = asRecord(parameters.nativeTickInterval, tickPath, out);
        if (tick !== null) {
          requireBoolean(tick, 'executeEachFrame', tickPath, out);
          const interval = requireFiniteNumber(tick, 'intervalSeconds', tickPath, out);
          if (interval !== null && interval < 0) {
            push(out, `${tickPath}.intervalSeconds`, 'expected a non-negative number');
          }
        }
      }
      break;
    }
    case 'repeatByActionValue':
      validateActionValueOperand(parameters.count, `${path}.parameters.count`, out);
      break;
    case 'launchProjectileLifetime':
      if (parameters.finish !== 'firstTickReach') {
        if (
          typeof parameters.finish !== 'object' ||
          parameters.finish === null ||
          Array.isArray(parameters.finish)
        ) {
          push(out, `${path}.parameters.finish`, 'expected firstTickReach or reach timing');
        } else {
          const timing = parameters.finish as Record<string, unknown>;
          const ticks = requireFiniteNumber(
            timing,
            'reachAfterTicks',
            `${path}.parameters.finish`,
            out,
          );
          const duration = requireFiniteNumber(
            timing,
            'maxDurationSeconds',
            `${path}.parameters.finish`,
            out,
          );
          if (ticks !== null && (!Number.isSafeInteger(ticks) || ticks < 1))
            push(
              out,
              `${path}.parameters.finish.reachAfterTicks`,
              'expected a positive safe integer',
            );
          if (duration !== null && duration <= 0)
            push(out, `${path}.parameters.finish.maxDurationSeconds`, 'expected a positive number');
        }
      }
      if (parameters.recycleDelaySeconds !== undefined) {
        const delay = requireFiniteNumber(
          parameters,
          'recycleDelaySeconds',
          `${path}.parameters`,
          out,
        );
        if (delay !== null && delay < 0)
          push(out, `${path}.parameters.recycleDelaySeconds`, 'expected a non-negative number');
      }
      break;
    case 'scheduleProjectileFinishCallback': {
      const delay = requireFiniteNumber(parameters, 'delaySeconds', `${path}.parameters`, out);
      if (delay !== null && delay <= 0) {
        push(out, `${path}.parameters.delaySeconds`, 'expected a positive number');
      }
      const recycleDelay = requireFiniteNumber(
        parameters,
        'recycleDelaySeconds',
        `${path}.parameters`,
        out,
      );
      if (recycleDelay !== null && recycleDelay < 0) {
        push(out, `${path}.parameters.recycleDelaySeconds`, 'expected a non-negative number');
      }
      break;
    }
    case 'setContextFlag':
      requireString(parameters, 'flag', `${path}.parameters`, out);
      validateScalar(parameters.value, `${path}.parameters.value`, out);
      if (parameters.target !== 'caster') {
        push(out, `${path}.parameters.target`, "expected 'caster'");
      }
      break;
    case 'openComboWindow':
      if (parameters.ownerContextKey !== undefined) {
        requireString(parameters, 'ownerContextKey', `${path}.parameters`, out);
        if (parameters.nextSkillKeyFromSlot !== 'comboSkill')
          push(out, `${path}.parameters.ownerContextKey`, 'requires current combo slot lookup');
      }
      if (parameters.nextSkillKeyFromSlot === 'comboSkill') {
        if (parameters.nextSkillKey !== undefined)
          push(out, `${path}.parameters.nextSkillKey`, 'must be omitted for slot lookup');
      } else {
        requireString(parameters, 'nextSkillKey', `${path}.parameters`, out);
        if (parameters.nextSkillKeyFromSlot !== undefined)
          push(out, `${path}.parameters.nextSkillKeyFromSlot`, "expected 'comboSkill'");
      }
      break;
    case 'showComboRingQte':
      validateActionValueOperand(
        parameters.earlyDurationSeconds,
        `${path}.parameters.earlyDurationSeconds`,
        out,
      );
      validateActionValueOperand(
        parameters.activeDurationSeconds,
        `${path}.parameters.activeDurationSeconds`,
        out,
      );
      break;
    case 'triggerCustomAbilityEvent':
      requireString(parameters, 'eventName', `${path}.parameters`, out);
      requireFiniteNumber(parameters, 'eventParam', `${path}.parameters`, out);
      requireEnum(parameters, 'target', new Set(['caster']), `${path}.parameters`, out);
      if (parameters.source !== undefined) {
        requireEnum(
          parameters,
          'source',
          new Set(['caster', 'currentAbilityEntity']),
          `${path}.parameters`,
          out,
        );
      }
      break;
    case 'castSkillDuringAction':
      validateActionStringOperand(parameters.skillId, `${path}.parameters.skillId`, out);
      requireEnum(parameters, 'target', new Set(['caster', 'enemy']), `${path}.parameters`, out);
      requireBoolean(parameters, 'skipApplyCost', `${path}.parameters`, out);
      requireBoolean(parameters, 'inheritSourceSkillCastInfo', `${path}.parameters`, out);
      break;
    case 'changeSkillSlot':
      requireString(parameters, 'skillGroupKey', `${path}.parameters`, out);
      requireString(parameters, 'targetSkillKey', `${path}.parameters`, out);
      if (
        parameters.inheritOriginSkillCooldownProgress !== undefined &&
        typeof parameters.inheritOriginSkillCooldownProgress !== 'boolean'
      ) {
        push(out, `${path}.parameters.inheritOriginSkillCooldownProgress`, 'expected a boolean');
      }
      if (
        parameters.lifetime !== undefined &&
        parameters.lifetime !== 'infinite' &&
        parameters.lifetime !== 'finishByAction'
      ) {
        push(out, `${path}.parameters.lifetime`, "expected 'infinite' or 'finishByAction'");
      }
      if (parameters.revertedSkillKey !== undefined) {
        requireString(parameters, 'revertedSkillKey', `${path}.parameters`, out);
        if (parameters.lifetime === undefined) {
          push(
            out,
            `${path}.parameters.revertedSkillKey`,
            'requires an explicit native replacement lifetime',
          );
        }
      }
      break;
    case 'overrideBasicAttackMapping':
      requireString(parameters, 'skillId', `${path}.parameters`, out);
      break;
    case 'overrideMultiDashLimit':
      validateActionValueOperand(parameters.dashCount, `${path}.parameters.dashCount`, out);
      break;
    case 'changePlayerActionMode':
      requireString(parameters, 'modeId', `${path}.parameters`, out);
      requireEnum(parameters, 'lifetime', new Set(['finishByAction']), `${path}.parameters`, out);
      break;
    case 'changeNativeSkillType':
      requireString(parameters, 'targetSkillKey', `${path}.parameters`, out);
      requireEnum(parameters, 'nativeSkillType', NATIVE_SKILL_TYPES_SET, `${path}.parameters`, out);
      break;
    case 'inheritSkillCastInfoForBasicAttack':
      break;
    case 'listenForCombatEvents':
      if (!Array.isArray(parameters.responses) || parameters.responses.length === 0) {
        push(out, `${path}.parameters.responses`, 'expected a non-empty array');
      } else {
        const keys = new Set<string>();
        parameters.responses.forEach((response, index) => {
          const responsePath = `${path}.parameters.responses[${index}]`;
          const record = asRecord(response, responsePath, out);
          if (record === null) return;
          const key = requireString(record, 'key', responsePath, out);
          if (key !== null) {
            if (keys.has(key)) push(out, `${responsePath}.key`, `duplicate response key '${key}'`);
            keys.add(key);
          }
          validateEventTrigger(record.event, `${responsePath}.event`, out);
          if (
            record.phase !== undefined &&
            record.phase !== 'dataAction' &&
            record.phase !== 'skill'
          ) {
            push(out, `${responsePath}.phase`, "expected 'dataAction' or 'skill'");
          }
          if (record.priority !== undefined) {
            if (typeof record.priority !== 'number' || !Number.isInteger(record.priority)) {
              push(out, `${responsePath}.priority`, 'expected an integer');
            } else if (record.phase !== 'dataAction') {
              push(out, `${responsePath}.priority`, 'requires dataAction phase');
            }
          }
          if (record.condition !== undefined) {
            validateCombatCondition(
              record.condition,
              `${responsePath}.condition`,
              out,
              currentTargetAvailable,
            );
          }
          validateActionSequence(
            record.sequence,
            `${responsePath}.sequence`,
            out,
            currentTargetAvailable,
          );
        });
      }
      break;
  }
}

/** ActionSequenceDefinition：严格按数组顺序同步执行的步骤集合。 */
export function validateActionSequence(
  value: unknown,
  path: string,
  out: SkillDefinitionValidationIssue[],
  currentTargetAvailable = false,
): void {
  const record = asRecord(value, path, out);
  if (record === null) return;
  if (!Array.isArray(record.steps)) {
    push(out, `${path}.steps`, 'expected an array');
    return;
  }
  record.steps.forEach((step, index) => {
    validateCombatStep(step, `${path}.steps[${index}]`, out, currentTargetAvailable);
  });
  // 嵌套结构校验：条件、once 与 Context 迭代必须有对应分支。
  record.steps.forEach((step, index) => {
    const recordStep = asRecord(step, `${path}.steps[${index}]`, out);
    if (recordStep === null) return;
    const stepKind = recordStep.kind;
    if (stepKind === 'conditional') {
      validateActionSequence(
        recordStep.whenTrue,
        `${path}.steps[${index}].whenTrue`,
        out,
        currentTargetAvailable,
      );
      if (recordStep.whenFalse !== undefined) {
        validateActionSequence(
          recordStep.whenFalse,
          `${path}.steps[${index}].whenFalse`,
          out,
          currentTargetAvailable,
        );
      }
    } else if (stepKind === 'switch') {
      const optionsPath = `${path}.steps[${index}].options`;
      if (!Array.isArray(recordStep.options)) {
        push(out, optionsPath, 'expected an array');
        return;
      }
      recordStep.options.forEach((option, optionIndex) => {
        const optionPath = `${optionsPath}[${optionIndex}]`;
        const entry = asRecord(option, optionPath, out);
        if (entry === null) return;
        validateActionValueOperand(entry.value, `${optionPath}.value`, out);
        validateActionSequence(
          entry.sequence,
          `${optionPath}.sequence`,
          out,
          currentTargetAvailable,
        );
      });
    } else if (stepKind === 'scheduleProjectileFinishCallback') {
      const callbackPath = `${path}.steps[${index}].callback`;
      validateAbilityEntityChildSkill(recordStep.callback, callbackPath, out);
      const callback = asRecord(recordStep.callback, callbackPath, out);
      if (callback !== null) {
        requireEnum(callback, 'nativeSkillType', NATIVE_SKILL_TYPES_SET, callbackPath, out);
        const duration = requireFiniteNumber(callback, 'naturalDurationFrames', callbackPath, out);
        if (duration !== null && (!Number.isInteger(duration) || duration < 1))
          push(out, `${callbackPath}.naturalDurationFrames`, 'expected a positive integer');
        const castPath = `${callbackPath}.castResource`;
        const cast = asRecord(callback.castResource, castPath, out);
        if (cast !== null) {
          requireNonNegativeInteger(cast, 'costFrame', castPath, out);
          requireFiniteNumber(cast, 'cooldownSeconds', castPath, out);
          requireInteger(cast, 'maxChargeTime', castPath, out);
          const costPath = `${castPath}.cost`;
          const cost = asRecord(cast.cost, costPath, out);
          if (cost !== null) {
            requireEnum(cost, 'resource', COMBAT_RESOURCES_SET, costPath, out);
            validateLevelValues(cost.value, `${costPath}.value`, out);
            validateLevelValues(
              cost.availabilityThreshold,
              `${costPath}.availabilityThreshold`,
              out,
            );
          }
        }
      }
    } else if (
      stepKind === 'once' ||
      stepKind === 'withActionBlackboardScope' ||
      stepKind === 'repeatEachTick' ||
      stepKind === 'repeatByActionValue'
    ) {
      validateActionSequence(
        recordStep.body,
        `${path}.steps[${index}].body`,
        out,
        currentTargetAvailable,
      );
    } else if (stepKind === 'forEachContextTarget') {
      validateActionSequence(recordStep.body, `${path}.steps[${index}].body`, out, true);
    }
  });
}

function containsCombatEventListener(value: unknown): boolean {
  if (typeof value !== 'object' || value === null) return false;
  const record = value as Record<string, unknown>;
  if (record.kind === 'scheduleProjectileFinishCallback') {
    const callback = record.callback as Record<string, unknown> | undefined;
    return (
      Array.isArray(callback?.scheduledSequences) &&
      callback.scheduledSequences.some(
        item =>
          typeof item === 'object' &&
          item !== null &&
          containsCombatEventListener((item as Record<string, unknown>).sequence),
      )
    );
  }
  if (record.kind === 'listenForCombatEvents') return true;
  if (record.kind === 'switch' && Array.isArray(record.options)) {
    return record.options.some(
      option =>
        typeof option === 'object' &&
        option !== null &&
        containsCombatEventListener((option as Record<string, unknown>).sequence),
    );
  }
  if (record.kind === 'conditional') {
    return (
      containsCombatEventListener(record.whenTrue) || containsCombatEventListener(record.whenFalse)
    );
  }
  if (
    record.kind === 'once' ||
    record.kind === 'withActionBlackboardScope' ||
    record.kind === 'repeatEachTick' ||
    record.kind === 'repeatByActionValue' ||
    record.kind === 'forEachContextTarget'
  ) {
    return containsCombatEventListener(record.body);
  }
  if (Array.isArray(record.steps)) return record.steps.some(containsCombatEventListener);
  return false;
}

/** ScheduledSequenceDefinition：相对释放帧的调度项。 */
export function validateScheduledSequence(
  value: unknown,
  path: string,
  out: SkillDefinitionValidationIssue[],
  currentTargetAvailable = false,
): void {
  const record = asRecord(value, path, out);
  if (record === null) return;
  const startFrame = requireNonNegativeInteger(record, 'startFrame', path, out);
  if (record.endFrame !== undefined) {
    const endFrame = requireNonNegativeInteger(record, 'endFrame', path, out);
    if (endFrame !== null && startFrame !== null && endFrame < startFrame) {
      push(out, `${path}.endFrame`, 'must not be less than startFrame');
    }
  }
  if (containsCombatEventListener(record.sequence) && record.endFrame === undefined) {
    push(out, `${path}.endFrame`, 'combat event listeners require an end frame');
  }
  validateActionSequence(record.sequence, `${path}.sequence`, out, currentTargetAvailable);
}

/**
 * CombatEventTrigger 的严格验证，覆盖全部事件 kind。
 */
function validateEventTrigger(
  value: unknown,
  path: string,
  out: SkillDefinitionValidationIssue[],
): void {
  const record = asRecord(value, path, out);
  if (record === null) return;
  const kind = requireString(record, 'kind', path, out);
  if (kind === null) return;
  switch (kind) {
    case 'operatorHit':
      break;
    case 'abilityEvent':
      requireEnum(record, 'event', new Set(DIRECT_COMBAT_EVENT_TRIGGER_EVENTS), path, out);
      break;
    case 'operatorHealed':
      if (record.role !== undefined) {
        requireEnum(record, 'role', new Set(['source', 'target']), path, out);
      }
      break;
    case 'buffApplied':
    case 'buffOutput':
    case 'airborneOutput':
    case 'knockDownOutput':
      break;
    case 'buffConsumed':
      if (record.buffIds !== undefined) {
        if (!Array.isArray(record.buffIds)) {
          push(out, `${path}.buffIds`, 'expected an array');
        } else {
          record.buffIds.forEach((buffId, index) => {
            if (typeof buffId !== 'string' || buffId.length === 0) {
              push(out, `${path}.buffIds[${index}]`, 'expected a non-empty string');
            }
          });
        }
      }
      break;
    case 'spGained':
      if (record.source !== undefined)
        requireEnum(record, 'source', SP_GAIN_SOURCES_SET, path, out);
      if (record.gainKind !== undefined)
        requireEnum(record, 'gainKind', SP_GAIN_KINDS_SET, path, out);
      break;
    case 'damageTagHit':
      requireEnum(record, 'tag', DAMAGE_TAGS_SET, path, out);
      requireEnum(record, 'scope', TRIGGER_SCOPES_SET, path, out);
      break;
    case 'elementalInflictionApplied':
      validateElements(record.elements, `${path}.elements`, out);
      requireEnum(record, 'scope', TRIGGER_SCOPES_SET, path, out);
      break;
    case 'physicalInflictionApplied': {
      const types = Array.isArray(record.types) ? record.types : [record.types];
      types.forEach((type, index) => {
        if (typeof type !== 'string' || !PHYSICAL_INFLICTION_TYPES_SET.has(type)) {
          push(
            out,
            Array.isArray(record.types) ? `${path}.types[${index}]` : `${path}.types`,
            'unknown physical infliction type',
          );
        }
      });
      requireEnum(record, 'scope', TRIGGER_SCOPES_SET, path, out);
      break;
    }
    case 'skillHit':
      requireString(record, 'skillGroupKey', path, out);
      requireEnum(record, 'scope', TRIGGER_SCOPES_SET, path, out);
      break;
    case 'enemyDefeated':
      requireEnum(record, 'scope', TRIGGER_SCOPES_SET, path, out);
      break;
      break;
    default:
      push(out, `${path}.kind`, 'unknown event trigger kind');
      break;
  }
}

/** 校验独立动作序列；技能、Buff 与配装事件共用同一种顺序语义。 */
export function validateActionSequenceDefinition(
  value: unknown,
  path = '$',
): SkillDefinitionValidationIssue[] {
  const out: SkillDefinitionValidationIssue[] = [];
  validateActionSequence(value, path, out);
  return out;
}

/** 校验独立战斗事件触发器。 */
export function validateCombatEventTriggerDefinition(
  value: unknown,
  path = '$',
): SkillDefinitionValidationIssue[] {
  const out: SkillDefinitionValidationIssue[] = [];
  validateEventTrigger(value, path, out);
  return out;
}

/** CombatEventHandlerDefinition：事件处理器的完整结构。 */
export function validateEventHandler(
  value: unknown,
  path: string,
  out: SkillDefinitionValidationIssue[],
): void {
  const record = asRecord(value, path, out);
  if (record === null) return;
  requireString(record, 'key', path, out);
  validateEventTrigger(record.event, `${path}.event`, out);
  if (record.condition !== undefined) {
    validateCombatCondition(record.condition, `${path}.condition`, out);
  }
  if (!Array.isArray(record.scheduledSequences) || record.scheduledSequences.length === 0) {
    push(out, `${path}.scheduledSequences`, 'expected a non-empty array');
  } else {
    record.scheduledSequences.forEach((sequence, index) => {
      validateScheduledSequence(sequence, `${path}.scheduledSequences[${index}]`, out);
    });
  }
}
