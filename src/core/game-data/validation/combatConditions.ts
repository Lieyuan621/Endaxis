import { GAMEPLAY_TAG_MATCH_TYPES } from '../../../../packages/game-data-contract/src/gameplayTags';
import {
  BUFF_SINGLE_TARGETS,
  COMBAT_CONDITION_KINDS,
  COMBAT_TARGETS,
  GLOBAL_COOLDOWN_TARGETS,
  COMPARISON_OPERATORS,
  HEAL_TARGETS,
  OPERATOR_ROLES,
} from '../operatorDefinition';
import { ENEMY_RANKS } from '../enemyRank';
import { COMBAT_OBJECT_TYPES } from '../../../../packages/game-data-contract/src/primitives';
import {
  type SkillDefinitionValidationIssue,
  DAMAGE_ELEMENTS_SET,
  DAMAGE_TYPES_SET,
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
  requireNonNegativeInteger,
  requireBoolean,
  requireEnum,
  validateActionValueOperand,
  validateActionStringOperand,
  validateLevelValuesOrActionValueOperand,
  validateNonEmptyStringArray,
  validateDamageTags,
  validateDamageFeatures,
  validateScalar,
  validateElements,
  validateGameplayTags,
} from './definitionValues';

const CONDITION_KINDS = new Set<string>(COMBAT_CONDITION_KINDS);

const ENEMY_RANKS_SET = new Set<string>(ENEMY_RANKS);

const HEALTH_TARGETS_SET = new Set<string>([...COMBAT_TARGETS, ...HEAL_TARGETS]);

const BUFF_CONDITION_TARGETS_SET = new Set<string>([...BUFF_SINGLE_TARGETS, 'actionInputTarget']);

const COMPARISON_OPERATORS_SET = new Set<string>(COMPARISON_OPERATORS);

const HEALTH_VALUE_TYPES_SET = new Set<string>(['current', 'ratio']);

const TAG_QUERY_TYPES_WITH_EXACT_SET = new Set<string>(GAMEPLAY_TAG_MATCH_TYPES);

/**
 * CombatCondition 的严格验证。覆盖全部条件 kind 及其必填/可选字段。
 */
export function validateCombatCondition(
  value: unknown,
  path: string,
  out: SkillDefinitionValidationIssue[],
  currentTargetAvailable = false,
): void {
  const record = asRecord(value, path, out);
  if (record === null) return;
  const kind = requireString(record, 'kind', path, out);
  if (kind === null || !CONDITION_KINDS.has(kind)) {
    if (kind !== null) push(out, `${path}.kind`, 'unknown condition kind');
    return;
  }

  switch (kind) {
    case 'constant':
      if (typeof record.value !== 'boolean') push(out, `${path}.value`, 'expected boolean');
      break;
    case 'combatActive':
    case 'singleEnemyPresent':
    case 'casterControlled':
    case 'casterComboPending':
    case 'eventComboRingQteSucceeded':
    case 'eventSourceMatchesBuffSource':
    case 'eventSourceMatchesBuffSourceEntitySource':
    case 'eventSourceControlled':
    case 'buffSourceMatchesOwner':
    case 'eventSkillCastMatchesBuffSource':
      break;
    case 'ownerSpawnedAbilityEntityPresent':
      if (
        record.abilityEntityIds !== undefined &&
        (!Array.isArray(record.abilityEntityIds) ||
          !record.abilityEntityIds.every(value => typeof value === 'string' && value.length > 0))
      ) {
        push(out, `${path}.abilityEntityIds`, 'expected non-empty string IDs');
      }
      if (
        record.sameSourceSkillCast !== undefined &&
        typeof record.sameSourceSkillCast !== 'boolean'
      ) {
        push(out, `${path}.sameSourceSkillCast`, 'expected a boolean');
      }
      break;
    case 'characterTypeIn':
      requireEnum(record, 'target', new Set(['caster', 'buffOwner']), path, out);
      if (!Array.isArray(record.characterTypes) || record.characterTypes.length === 0) {
        push(out, `${path}.characterTypes`, 'expected a non-empty array');
      } else {
        record.characterTypes.forEach((value, index) => {
          if (typeof value !== 'string' || !DAMAGE_ELEMENTS_SET.has(value)) {
            push(out, `${path}.characterTypes[${index}]`, 'unknown character type');
          }
        });
      }
      if (record.outputKey !== undefined) requireString(record, 'outputKey', path, out);
      break;
    case 'operatorRoleIn':
      requireEnum(record, 'target', new Set(['caster', 'buffOwner', 'eventTarget']), path, out);
      if (!Array.isArray(record.roles) || record.roles.length === 0) {
        push(out, `${path}.roles`, 'expected a non-empty array');
      } else {
        const roles = new Set<string>(OPERATOR_ROLES);
        record.roles.forEach((value, index) => {
          if (typeof value !== 'string' || !roles.has(value)) {
            push(out, `${path}.roles[${index}]`, 'unknown operator role');
          }
        });
      }
      break;
    case 'contextTargetContains':
      requireString(record, 'parentContextKey', path, out);
      requireEnum(record, 'child', new Set(['eventTarget']), path, out);
      break;
    case 'enemyRankIn':
      if (!Array.isArray(record.ranks)) {
        push(out, `${path}.ranks`, 'expected an array');
      } else {
        record.ranks.forEach((rank, index) => {
          if (typeof rank === 'string' && !ENEMY_RANKS_SET.has(rank)) {
            push(out, `${path}.ranks[${index}]`, 'unknown enemy rank');
          } else if (typeof rank !== 'string') {
            push(out, `${path}.ranks[${index}]`, 'unknown enemy rank');
          }
        });
      }
      break;
    case 'enemySuperArmorCompare':
      requireEnum(record, 'operator', COMPARISON_OPERATORS_SET, path, out);
      validateActionValueOperand(record.value, `${path}.value`, out);
      break;
    case 'cameraToTargetAngleCompare':
      requireEnum(record, 'operator', COMPARISON_OPERATORS_SET, path, out);
      validateActionValueOperand(record.value, `${path}.value`, out);
      break;
    case 'skillBranchEnabled':
      requireString(record, 'branchKey', path, out);
      break;
    case 'targetStaggered':
      requireEnum(record, 'target', COMBAT_TARGETS_SET, path, out);
      break;
    case 'healthCompare':
      requireEnum(record, 'target', HEALTH_TARGETS_SET, path, out);
      if (record.target === 'contextTarget') {
        requireString(record, 'contextKey', path, out);
      } else if (record.contextKey !== undefined) {
        push(out, `${path}.contextKey`, 'requires target=contextTarget');
      }
      requireEnum(record, 'valueType', HEALTH_VALUE_TYPES_SET, path, out);
      requireEnum(record, 'operator', COMPARISON_OPERATORS_SET, path, out);
      validateActionValueOperand(record.value, `${path}.value`, out);
      break;
    case 'poiseCompare':
      requireEnum(record, 'target', COMBAT_TARGETS_SET, path, out);
      requireBoolean(record, 'returnValueIfMissing', path, out);
      requireEnum(record, 'operator', COMPARISON_OPERATORS_SET, path, out);
      validateActionValueOperand(record.value, `${path}.value`, out);
      break;
    case 'contextFlagEquals':
      requireString(record, 'flag', path, out);
      validateScalar(record.value, `${path}.value`, out);
      break;
    case 'probability':
      validateActionValueOperand(record.probability, `${path}.probability`, out);
      break;
    case 'actionValueCompare':
      validateActionValueOperand(record.left, `${path}.left`, out);
      requireEnum(record, 'operator', COMPARISON_OPERATORS_SET, path, out);
      validateActionValueOperand(record.right, `${path}.right`, out);
      break;
    case 'buffBlackboardValueCompare': {
      requireEnum(record, 'target', BUFF_CONDITION_TARGETS_SET, path, out);
      const query = asRecord(record.query, `${path}.query`, out);
      if (query !== null) {
        const queryKind = requireEnum(query, 'kind', new Set(['id', 'tag']), `${path}.query`, out);
        if (queryKind === 'id') {
          validateNonEmptyStringArray(query.buffIds, `${path}.query.buffIds`, out);
        } else if (queryKind === 'tag') {
          requireEnum(query, 'tagQueryType', TAG_QUERY_TYPES_SET, `${path}.query`, out);
          validateGameplayTags(query.buffTags, `${path}.query.buffTags`, out);
        }
      }
      requireString(record, 'desiredKey', path, out);
      requireString(record, 'outputKey', path, out);
      requireEnum(record, 'operator', COMPARISON_OPERATORS_SET, path, out);
      validateActionValueOperand(record.value, `${path}.value`, out);
      break;
    }
    case 'contextTargetCountCompare':
      requireString(record, 'contextKey', path, out);
      requireEnum(record, 'operator', COMPARISON_OPERATORS_SET, path, out);
      requireNonNegativeInteger(record, 'value', path, out);
      if (record.outputKey !== undefined) requireString(record, 'outputKey', path, out);
      break;
    case 'contextTargetObjectTypeMatch':
    case 'actionInputTargetObjectTypeMatch':
      if (record.kind === 'contextTargetObjectTypeMatch')
        requireString(record, 'contextKey', path, out);
      if (
        record.objectTypes !== 'all' &&
        (!Array.isArray(record.objectTypes) ||
          !record.objectTypes.every(value => COMBAT_OBJECT_TYPES.some(type => type === value)))
      ) {
        push(out, `${path}.objectTypes`, 'expected readable object types or all');
      }
      break;
    case 'actionInputTargetIdentityMatch':
      requireEnum(
        record,
        'other',
        new Set(['actionSource', 'actionOwner', 'controlledOperator']),
        path,
        out,
      );
      requireEnum(record, 'operator', new Set(['equal', 'notEqual']), path, out);
      break;
    case 'contextTargetIdentityMatch':
      requireString(record, 'contextKey', path, out);
      requireEnum(
        record,
        'other',
        new Set(['actionSource', 'actionOwner', 'controlledOperator']),
        path,
        out,
      );
      requireEnum(record, 'operator', new Set(['equal', 'notEqual']), path, out);
      break;
    case 'contextTargetEntityTagMatch':
      requireString(record, 'contextKey', path, out);
      requireEnum(record, 'tagQueryType', TAG_QUERY_TYPES_SET, path, out);
      validateGameplayTags(record.tags, `${path}.tags`, out);
      break;
    case 'contextTargetBuffStackCompare':
      requireString(record, 'contextKey', path, out);
      requireEnum(record, 'tagQueryType', TAG_QUERY_TYPES_SET, path, out);
      validateGameplayTags(record.buffTags, `${path}.buffTags`, out);
      requireEnum(record, 'operator', COMPARISON_OPERATORS_SET, path, out);
      validateActionValueOperand(record.value, `${path}.value`, out);
      break;
    case 'contextTargetBuffIdStackCompare':
      requireString(record, 'contextKey', path, out);
      validateNonEmptyStringArray(record.buffIds, `${path}.buffIds`, out);
      requireEnum(record, 'operator', COMPARISON_OPERATORS_SET, path, out);
      validateActionValueOperand(record.value, `${path}.value`, out);
      break;
    case 'abilityEntityRemainingDurationCompare':
      requireEnum(record, 'operator', COMPARISON_OPERATORS_SET, path, out);
      validateActionValueOperand(record.value, `${path}.value`, out);
      if (record.outputKey !== undefined) requireString(record, 'outputKey', path, out);
      if (!currentTargetAvailable) {
        push(out, path, 'requires a forEachContextTarget body');
      }
      break;
    case 'statusActive':
      requireString(record, 'statusKey', path, out);
      requireEnum(record, 'target', COMBAT_TARGETS_SET, path, out);
      if (record.minimumStacks !== undefined) {
        requireNonNegativeInteger(record, 'minimumStacks', path, out);
      }
      break;
    case 'buffStackCompare':
      requireEnum(record, 'target', BUFF_CONDITION_TARGETS_SET, path, out);
      requireEnum(record, 'tagQueryType', TAG_QUERY_TYPES_SET, path, out);
      validateGameplayTags(record.buffTags, `${path}.buffTags`, out);
      requireEnum(record, 'operator', COMPARISON_OPERATORS_SET, path, out);
      validateActionValueOperand(record.value, `${path}.value`, out);
      if (record.sameSourceSkillCast !== undefined) {
        requireBoolean(record, 'sameSourceSkillCast', path, out);
      }
      break;
    case 'buffTagIdCountCompare':
      requireEnum(record, 'target', BUFF_CONDITION_TARGETS_SET, path, out);
      requireEnum(record, 'tagQueryType', TAG_QUERY_TYPES_SET, path, out);
      validateGameplayTags(record.buffTags, `${path}.buffTags`, out);
      requireEnum(record, 'operator', COMPARISON_OPERATORS_SET, path, out);
      validateActionValueOperand(record.value, `${path}.value`, out);
      break;
    case 'currentBuffStackCompare':
      requireEnum(record, 'operator', COMPARISON_OPERATORS_SET, path, out);
      validateActionValueOperand(record.value, `${path}.value`, out);
      break;
    case 'entityTagMatch':
      requireEnum(record, 'target', BUFF_CONDITION_TARGETS_SET, path, out);
      requireEnum(record, 'tagQueryType', TAG_QUERY_TYPES_SET, path, out);
      validateGameplayTags(record.tags, `${path}.tags`, out);
      break;
    case 'buffIdStackCompare':
      requireEnum(record, 'target', BUFF_CONDITION_TARGETS_SET, path, out);
      validateNonEmptyStringArray(record.buffIds, `${path}.buffIds`, out);
      requireEnum(record, 'operator', COMPARISON_OPERATORS_SET, path, out);
      validateLevelValuesOrActionValueOperand(record.value, `${path}.value`, out);
      if (record.sameSourceSkillCast !== undefined) {
        requireBoolean(record, 'sameSourceSkillCast', path, out);
      }
      break;
    case 'timedMarkerPresent':
      requireEnum(record, 'target', TIMED_MARKER_TARGETS_SET, path, out);
      validateActionStringOperand(record.markerId, `${path}.markerId`, out);
      break;
    case 'globalCooldownPresent':
      requireEnum(record, 'target', new Set(GLOBAL_COOLDOWN_TARGETS), path, out);
      requireString(record, 'markerId', path, out);
      break;
    case 'abilityEntityTimedMarkerPresent':
      validateActionStringOperand(record.markerId, `${path}.markerId`, out);
      if (record.contextKey !== undefined) requireString(record, 'contextKey', path, out);
      break;
    case 'eventDamageTagsMatch':
      requireEnum(record, 'match', TAG_QUERY_TYPES_WITH_EXACT_SET, path, out);
      validateDamageTags(record.tags, `${path}.tags`, out);
      break;
    case 'eventDamageGameplayTagsMatch':
      requireEnum(record, 'match', TAG_QUERY_TYPES_WITH_EXACT_SET, path, out);
      validateGameplayTags(record.tags, `${path}.tags`, out);
      break;
    case 'eventDamageFeaturesMatch':
      requireEnum(record, 'match', TAG_QUERY_TYPES_WITH_EXACT_SET, path, out);
      validateDamageFeatures(record.features, `${path}.features`, out);
      break;
    case 'eventDamageTypeIn':
      if (!Array.isArray(record.damageTypes) || record.damageTypes.length === 0) {
        push(out, `${path}.damageTypes`, 'expected a non-empty array');
      } else {
        record.damageTypes.forEach((damageType, index) => {
          if (typeof damageType !== 'string' || !DAMAGE_TYPES_SET.has(damageType)) {
            push(out, `${path}.damageTypes[${index}]`, 'unknown damage type');
          }
        });
      }
      break;
    case 'eventInflictionElementIn':
      // 原生 mask=0 合法且恒不匹配；不能把它扩大为全部元素。
      if (!Array.isArray(record.elements)) {
        push(out, `${path}.elements`, 'expected an array');
      } else {
        record.elements.forEach((element, index) => {
          if (typeof element !== 'string' || !INFLICTION_ELEMENTS_SET.has(element)) {
            push(out, `${path}.elements[${index}]`, 'unknown infliction element');
          }
        });
      }
      if (record.outputKey !== undefined) requireString(record, 'outputKey', path, out);
      break;
    case 'eventPhysicalInflictionTypeIn': {
      if (!Array.isArray(record.types) || record.types.length === 0) {
        push(out, `${path}.types`, 'expected a non-empty array');
      } else {
        record.types.forEach((type, index) => {
          if (typeof type !== 'string' || !PHYSICAL_INFLICTION_TYPES_SET.has(type)) {
            push(out, `${path}.types[${index}]`, 'unknown physical infliction type');
          }
        });
      }
      if (record.outputKey !== undefined) requireString(record, 'outputKey', path, out);
      break;
    }
    case 'currentSkillTypeIn':
      if (record.target !== 'caster' && record.target !== 'buffOwner') {
        push(out, `${path}.target`, "expected 'caster' or 'buffOwner'");
      }
      if (!Array.isArray(record.skillTypes) || record.skillTypes.length === 0) {
        push(out, `${path}.skillTypes`, 'expected a non-empty array');
      } else {
        record.skillTypes.forEach((value, index) => {
          if (!SKILL_TYPES_SET.has(value as never)) {
            push(out, `${path}.skillTypes[${index}]`, 'expected a known skill type');
          }
        });
      }
      break;
    case 'eventSkillTypeIn':
    case 'originSkillTypeIn':
      if (!Array.isArray(record.skillTypes) || record.skillTypes.length === 0) {
        push(out, `${path}.skillTypes`, 'expected a non-empty array');
      } else {
        record.skillTypes.forEach((value, index) => {
          if (!SKILL_TYPES_SET.has(value as never)) {
            push(out, `${path}.skillTypes[${index}]`, 'expected a known skill type');
          }
        });
      }
      break;
    case 'eventSkillIdIn':
      validateNonEmptyStringArray(record.skillIds, `${path}.skillIds`, out);
      break;
    case 'eventBuffIdMatch':
      validateNonEmptyStringArray(record.buffIds, `${path}.buffIds`, out);
      if (record.buffIdOutputKey !== undefined) requireString(record, 'buffIdOutputKey', path, out);
      break;
    case 'eventBuffEndedEarly':
      break;
    case 'eventBuffTagsMatch':
      requireEnum(record, 'match', TAG_QUERY_TYPES_SET, path, out);
      validateGameplayTags(record.buffTags, `${path}.buffTags`, out);
      if (record.buffIdOutputKey !== undefined) requireString(record, 'buffIdOutputKey', path, out);
      break;
    case 'eventTargetBuffCountCompare':
      requireEnum(record, 'tagQueryType', TAG_QUERY_TYPES_SET, path, out);
      validateGameplayTags(record.buffTags, `${path}.buffTags`, out);
      requireEnum(record, 'operator', COMPARISON_OPERATORS_SET, path, out);
      validateActionValueOperand(record.value, `${path}.value`, out);
      break;
    case 'eventConsumedBuffLayerCompare':
      requireEnum(record, 'operator', COMPARISON_OPERATORS_SET, path, out);
      validateActionValueOperand(record.value, `${path}.value`, out);
      if (record.outputKey !== undefined) requireString(record, 'outputKey', path, out);
      break;
    case 'eventHealTagsMatch':
      requireEnum(record, 'match', TAG_QUERY_TYPES_SET, path, out);
      validateGameplayTags(record.tags, `${path}.tags`, out);
      break;
    case 'eventOverheal':
      for (const key of ['overHealKey', 'finalHealKey', 'realHealKey'] as const) {
        if (record[key] !== undefined) requireString(record, key, path, out);
      }
      break;
    case 'eventSourceTargetMatch':
    case 'eventActionOwnerTargetMatch':
      requireEnum(record, 'operator', new Set(['equal', 'notEqual']), path, out);
      break;
    case 'elementalInflictionPresent':
      validateElements(record.elements, `${path}.elements`, out);
      if (record.minimumStacks !== undefined) {
        requireNonNegativeInteger(record, 'minimumStacks', path, out);
      }
      break;
    case 'elementalReactionActive':
      requireEnum(record, 'reaction', ELEMENTAL_REACTIONS_SET, path, out);
      if (record.minimumLevel !== undefined) {
        requireNonNegativeInteger(record, 'minimumLevel', path, out);
      }
      break;
    case 'not':
      validateCombatCondition(record.condition, `${path}.condition`, out, currentTargetAvailable);
      break;
    case 'all':
    case 'any':
      if (!Array.isArray(record.conditions) || record.conditions.length === 0) {
        push(out, `${path}.conditions`, 'expected a non-empty array');
      } else {
        record.conditions.forEach((condition, index) => {
          validateCombatCondition(
            condition,
            `${path}.conditions[${index}]`,
            out,
            currentTargetAvailable,
          );
        });
      }
      break;
    case 'deckAttributeCompare':
      requireEnum(record, 'left', OPERATOR_ATTRIBUTES_SET, path, out);
      requireEnum(record, 'operator', COMPARISON_OPERATORS_SET, path, out);
      requireEnum(record, 'right', OPERATOR_ATTRIBUTES_SET, path, out);
      break;
  }
}
