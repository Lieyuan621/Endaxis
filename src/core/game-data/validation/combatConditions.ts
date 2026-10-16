import {
  SKILL_INTERRUPT_REASONS,
  ABILITY_ENTITY_FINISH_REASONS,
} from '../../../../packages/game-data-contract/src/conditions';
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
  COMBAT_TARGETS_SET,
  TIMED_MARKER_TARGETS_SET,
  OPERATOR_ATTRIBUTES_SET,
  PHYSICAL_INFLICTION_TYPES_SET,
  SKILL_TYPES_SET,
  NORMAL_SKILL_SUB_TYPES_SET,
  TAG_QUERY_TYPES_SET,
  push,
  asRecord,
  requireString,
  requireBoolean,
  requireFiniteNumber,
  requireEnum,
  validateActionValueOperand,
  validateActionStringOperand,
  validateLevelValuesOrActionValueOperand,
  validateNonEmptyStringArray,
  validateDamageTags,
  validateDamageFeatures,
  validateGameplayTags,
} from './definitionValues';

const CONDITION_KINDS = new Set<string>(COMBAT_CONDITION_KINDS);

const ENEMY_RANKS_SET = new Set<string>(ENEMY_RANKS);

const HEALTH_TARGETS_SET = new Set<string>([
  ...COMBAT_TARGETS,
  ...HEAL_TARGETS,
  'actionInputTarget',
]);

const BUFF_CONDITION_TARGETS_SET = new Set<string>([...BUFF_SINGLE_TARGETS, 'actionInputTarget']);

const COMPARISON_OPERATORS_SET = new Set<string>(COMPARISON_OPERATORS);

const HEALTH_VALUE_TYPES_SET = new Set<string>(['current', 'ratio']);

const TAG_QUERY_TYPES_WITH_EXACT_SET = new Set<string>(GAMEPLAY_TAG_MATCH_TYPES);

/**
 * 校验布尔节点的操作及输入字段；节点引用的归属和连线类型由所属图校验。
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
  if (kind === 'conditionNode') {
    requireString(record, 'nodeId', path, out);
    return;
  }
  if (kind === null || !CONDITION_KINDS.has(kind)) {
    if (kind !== null) push(out, `${path}.kind`, 'unknown condition kind');
    return;
  }

  switch (kind) {
    case 'checkActionResult': {
      const action = asRecord(record.action, `${path}.action`, out);
      if (
        action &&
        (Object.keys(action).length !== 1 ||
          !Object.hasOwn(action, '$sequence') ||
          (action.$sequence !== null &&
            (typeof action.$sequence !== 'string' || !action.$sequence)))
      )
        push(out, `${path}.action`, 'expected an action graph reference');
      break;
    }
    case 'constant':
      if (typeof record.value !== 'boolean') push(out, `${path}.value`, 'expected boolean');
      break;
    case 'skillHasHit':
    case 'combatActive':
    case 'singleEnemyPresent':
    case 'casterControlled':
    case 'casterComboPending':
    case 'eventSourceMatchesBuffSource':
    case 'eventSourceMatchesBuffSourceEntitySource':
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
    case 'targetContains':
      validateTargetQuery(record.parent, `${path}.parent`, out);
      validateTargetQuery(record.child, `${path}.child`, out);
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
    case 'targetDistance':
      requireFiniteNumber(record, 'distance', path, out);
      for (const field of ['lessThan', 'includeTargetRadius', 'containsHittableObject'])
        requireBoolean(record, field, path, out);
      for (const field of ['source', 'target'])
        validateTargetQuery(record[field], `${path}.${field}`, out);
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
      if (record.target !== 'currentTarget' && record.target !== 'actionInputTarget')
        requireEnum(record, 'target', COMBAT_TARGETS_SET, path, out);
      requireBoolean(record, 'returnValueIfMissing', path, out);
      requireEnum(record, 'operator', COMPARISON_OPERATORS_SET, path, out);
      validateActionValueOperand(record.value, `${path}.value`, out);
      break;
    case 'probability':
      validateActionValueOperand(record.probability, `${path}.probability`, out);
      break;
    case 'stringEquals':
      validateActionStringOperand(record.left, `${path}.left`, out);
      validateActionStringOperand(record.right, `${path}.right`, out);
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
    case 'entityCountCompare':
      validateTargetQuery(record.target, `${path}.target`, out);
      requireBoolean(record, 'containsHittableTarget', path, out);
      requireBoolean(record, 'excludeDeadEntity', path, out);
      requireEnum(record, 'operator', COMPARISON_OPERATORS_SET, path, out);
      if (!Number.isInteger(record.value)) push(out, `${path}.value`, 'expected integer');
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
      requireEnum(record, 'selection', new Set(['first', 'all']), path, out);
      requireString(record, 'contextKey', path, out);
      requireEnum(
        record,
        'other',
        new Set(['actionSource', 'actionOwner', 'controlledOperator', 'actionInputTarget']),
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
      requireBoolean(record, 'compareZeroWhenTargetMissing', path, out);
      requireString(record, 'contextKey', path, out);
      requireEnum(record, 'tagQueryType', TAG_QUERY_TYPES_SET, path, out);
      validateGameplayTags(record.buffTags, `${path}.buffTags`, out);
      requireEnum(record, 'operator', COMPARISON_OPERATORS_SET, path, out);
      validateActionValueOperand(record.value, `${path}.value`, out);
      break;
    case 'contextTargetBuffIdStackCompare':
      requireBoolean(record, 'compareZeroWhenTargetMissing', path, out);
      requireString(record, 'contextKey', path, out);
      validateNonEmptyStringArray(record.buffIds, `${path}.buffIds`, out);
      requireEnum(record, 'operator', COMPARISON_OPERATORS_SET, path, out);
      validateActionValueOperand(record.value, `${path}.value`, out);
      break;
    case 'abilityEntityRemainingDurationCompare':
      requireEnum(record, 'operator', COMPARISON_OPERATORS_SET, path, out);
      validateActionValueOperand(record.value, `${path}.value`, out);
      if (record.target !== undefined) validateTargetQuery(record.target, `${path}.target`, out);
      if (record.outputKey !== undefined) requireString(record, 'outputKey', path, out);
      if (record.target === undefined && !currentTargetAvailable) {
        push(out, path, 'requires a forEachContextTarget body');
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
      requireBoolean(record, 'returnTrueIfNotExists', path, out);
      requireEnum(record, 'target', TIMED_MARKER_TARGETS_SET, path, out);
      validateActionStringOperand(record.markerId, `${path}.markerId`, out);
      break;
    case 'globalCooldownPresent':
      requireEnum(record, 'target', new Set(GLOBAL_COOLDOWN_TARGETS), path, out);
      requireString(record, 'markerId', path, out);
      break;
    case 'abilityEntityTimedMarkerPresent':
      requireBoolean(record, 'returnTrueIfNotExists', path, out);
      validateActionStringOperand(record.markerId, `${path}.markerId`, out);
      if (record.contextKey !== undefined) requireString(record, 'contextKey', path, out);
      break;
    case 'eventDamageTagsMatch':
      requireEnum(record, 'match', TAG_QUERY_TYPES_WITH_EXACT_SET, path, out);
      validateDamageTags(record.tags, `${path}.tags`, out);
      break;
    case 'eventTransferredPartTagsMatch':
      requireEnum(record, 'tagQueryType', TAG_QUERY_TYPES_SET, path, out);
      validateGameplayTags(record.tags, `${path}.tags`, out);
      if (record.saveToContextKey !== undefined)
        requireString(record, 'saveToContextKey', path, out);
      break;
    case 'eventDamageGameplayTagsMatch':
      requireEnum(record, 'match', TAG_QUERY_TYPES_WITH_EXACT_SET, path, out);
      validateGameplayTags(record.tags, `${path}.tags`, out);
      break;
    case 'eventDamageFeaturesMatch':
      requireEnum(record, 'match', TAG_QUERY_TYPES_WITH_EXACT_SET, path, out);
      validateDamageFeatures(record.features, `${path}.features`, out);
      break;
    case 'skillDamageTypeIn':
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
      if (record.normalSkillSubType !== undefined)
        requireEnum(record, 'normalSkillSubType', NORMAL_SKILL_SUB_TYPES_SET, path, out);
      if (
        record.target !== 'caster' &&
        record.target !== 'buffOwner' &&
        record.target !== 'controlledOperator'
      ) {
        push(out, `${path}.target`, "expected 'caster', 'buffOwner' or 'controlledOperator'");
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
      if (record.kind === 'eventSkillTypeIn' && record.normalSkillSubType !== undefined)
        requireEnum(record, 'normalSkillSubType', NORMAL_SKILL_SUB_TYPES_SET, path, out);
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
    case 'skillInterruptReasonIn':
      if (!Array.isArray(record.reasons)) {
        push(out, `${path}.reasons`, 'expected an array');
      } else {
        record.reasons.forEach((value, index) => {
          if (!(SKILL_INTERRUPT_REASONS as readonly unknown[]).includes(value))
            push(out, `${path}.reasons[${index}]`, 'expected a known skill interrupt reason');
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
    case 'eventAbilityEntityFinishReasonIn':
      if (!Array.isArray(record.reasons)) push(out, `${path}.reasons`, 'expected an array');
      else
        record.reasons.forEach((reason, index) => {
          if (!ABILITY_ENTITY_FINISH_REASONS.some(value => value === reason))
            push(out, `${path}.reasons[${index}]`, 'expected a known ability entity finish reason');
        });
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
    case 'eventBuffEnhanceLayerCompare':
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

export function validateTargetQuery(
  value: unknown,
  path: string,
  out: SkillDefinitionValidationIssue[],
): void {
  const query = asRecord(value, path, out);
  if (!query) return;
  requireEnum(
    query,
    'kind',
    new Set([
      'owner',
      'source',
      'inputTarget',
      'context',
      'mainCharacter',
      'battleMainTarget',
      'godEntity',
      'unfinishedProjectiles',
      'enemyByTags',
      'fixed',
      'characterTeam',
      'mainTarget',
      'abilityEntityTarget',
      'ownerSoul',
      'allyHitBox',
      'fixedPoint',
      'ownerSpawned',
    ]),
    path,
    out,
  );
  if (query.kind === 'context') requireString(query, 'key', path, out);
  if (query.kind === 'enemyByTags') {
    requireEnum(query, 'tagQueryType', TAG_QUERY_TYPES_SET, path, out);
    validateGameplayTags(query.tags, `${path}.tags`, out);
  }
  if (query.kind === 'fixed') requireEnum(query, 'target', new Set(['enemy', 'caster']), path, out);
  if (query.kind === 'characterTeam') {
    requireBoolean(query, 'excludeOwner', path, out);
    if (query.owner !== undefined) validateTargetQuery(query.owner, `${path}.owner`, out);
  }
  if (
    query.kind === 'mainTarget' ||
    query.kind === 'abilityEntityTarget' ||
    query.kind === 'ownerSoul' ||
    query.kind === 'allyHitBox' ||
    query.kind === 'ownerSpawned' ||
    query.kind === 'fixedPoint'
  )
    validateTargetQuery(query.owner, `${path}.owner`, out);
  if (query.kind === 'fixedPoint') {
    validateTargetQuery(query.center, `${path}.center`, out);
    validateTargetQuery(query.directionTarget, `${path}.directionTarget`, out);
  }
  if (query.kind === 'allyHitBox') {
    requireBoolean(query, 'checkAlive', path, out);
    requireBoolean(query, 'containsUnmarkable', path, out);
    requireBoolean(query, 'replacePartsWithMainBodies', path, out);
  }
  if (query.kind === 'ownerSpawned') {
    if (
      !Array.isArray(query.abilityEntityIds) ||
      query.abilityEntityIds.some(id => typeof id !== 'string')
    )
      push(out, `${path}.abilityEntityIds`, 'expected string array');
    requireBoolean(query, 'sameSourceSkillCast', path, out);
  }
}
