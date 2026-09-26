/** 技能自身结构的严格校验；动作与能力实体的递归校验归 validation/actionPrograms。 */
import { SKILL_LEVEL_SOURCES } from './operatorDefinition';
import {
  type SkillDefinitionValidationIssue,
  SKILL_TYPES_SET,
  push,
  asRecord,
  requireString,
  requireNonNegativeInteger,
  requireBoolean,
  requireEnum,
  validateLevelValues,
  NATIVE_SKILL_TYPES_SET,
  COMBAT_RESOURCES_SET,
} from './validation/definitionValues';
import { validateCombatCondition } from './validation/combatConditions';
import {
  type ActionGraphContextEntry,
  validateActionGraphContexts,
  validateActionGraphReference,
  validateActionGraphActions,
  validateScheduledSequence,
  validateEventHandler,
} from './validation/actionPrograms';
export type { SkillDefinitionValidationIssue } from './validation/definitionValues';

const SKILL_LEVEL_SOURCES_SET = new Set<string>(SKILL_LEVEL_SOURCES);

function requirePositiveInteger(
  value: Record<string, unknown>,
  key: string,
  path: string,
  out: SkillDefinitionValidationIssue[],
): number | null {
  const v = value[key];
  if (typeof v !== 'number' || !Number.isInteger(v) || v <= 0) {
    push(out, `${path}.${key}`, 'expected a positive integer');
    return null;
  }
  return v;
}

/**
 * 校验独立的等级值。装备、机制等定义可复用此入口，避免复制 SkillDefinition 的基础规则。
 */
export function validateLevelValuesDefinition(
  value: unknown,
  path = '$',
): SkillDefinitionValidationIssue[] {
  const out: SkillDefinitionValidationIssue[] = [];
  validateLevelValues(value, path, out);
  return out;
}

/** 校验独立条件树；调用方负责决定该条件出现在哪种定义中。 */
export function validateCombatConditionDefinition(
  value: unknown,
  path = '$',
): SkillDefinitionValidationIssue[] {
  const out: SkillDefinitionValidationIssue[] = [];
  validateCombatCondition(value, path, out);
  return out;
}

/**
 * 严格验证 SkillDefinition 的结构与取值，返回问题列表（空数组表示通过）。
 * 调用方传入不可信 unknown；本模块不修改输入，不产生运行时对象。
 */
export function validateSkillDefinition(
  value: unknown,
  path = '$',
): SkillDefinitionValidationIssue[] {
  const out: SkillDefinitionValidationIssue[] = [];
  const record = asRecord(value, path, out);
  if (record === null) return out;
  if (record.actionGraph !== undefined) {
    out.push(...validateActionGraphActions(record.actionGraph, `${path}.actionGraph`));
    // 实体上下文与嵌套监听器寿命按入口沿图遍历；缺失节点由契约校验报告。
    const entries: ActionGraphContextEntry[] = [];
    if (Array.isArray(record.scheduledSequences))
      record.scheduledSequences.forEach((sequence, index) => {
        const sequencePath = `${path}.scheduledSequences[${index}]`;
        const row =
          sequence !== null && typeof sequence === 'object' && !Array.isArray(sequence)
            ? (sequence as Record<string, unknown>)
            : null;
        entries.push({
          reference: row === null ? undefined : row.sequence,
          path: sequencePath,
          currentTargetAvailable: false,
          ...(row !== null && row.endFrame === undefined
            ? { missingListenerEndFramePath: `${sequencePath}.endFrame` }
            : {}),
        });
      });
    const route =
      record.switchToBuffCast !== null &&
      typeof record.switchToBuffCast === 'object' &&
      !Array.isArray(record.switchToBuffCast)
        ? (record.switchToBuffCast as Record<string, unknown>)
        : null;
    if (route !== null)
      entries.push({
        reference: route.sequence,
        path: `${path}.switchToBuffCast.sequence`,
        currentTargetAvailable: false,
      });
    if (Array.isArray(record.eventHandlers))
      record.eventHandlers.forEach((handler, index) => {
        const row =
          handler !== null && typeof handler === 'object' && !Array.isArray(handler)
            ? (handler as Record<string, unknown>)
            : null;
        if (row === null || !Array.isArray(row.scheduledSequences)) return;
        row.scheduledSequences.forEach((sequence, sequenceIndex) => {
          const sequencePath = `${path}.eventHandlers[${index}].scheduledSequences[${sequenceIndex}]`;
          const item =
            sequence !== null && typeof sequence === 'object' && !Array.isArray(sequence)
              ? (sequence as Record<string, unknown>)
              : null;
          entries.push({
            reference: item === null ? undefined : item.sequence,
            path: sequencePath,
            currentTargetAvailable: false,
            ...(item !== null && item.endFrame === undefined
              ? { missingListenerEndFramePath: `${sequencePath}.endFrame` }
              : {}),
          });
        });
      });
    validateActionGraphContexts(record.actionGraph, `${path}.actionGraph`, entries, out);
  }
  if ('buffDefinitions' in record)
    push(
      out,
      `${path}.buffDefinitions`,
      'skills may reference Buffs but cannot own their definitions',
    );

  requireString(record, 'key', path, out);
  if (record.skillType !== undefined) requireEnum(record, 'skillType', SKILL_TYPES_SET, path, out);
  if (record.levelSource !== undefined)
    requireEnum(record, 'levelSource', SKILL_LEVEL_SOURCES_SET, path, out);
  if (record.nativeSkillType !== undefined)
    requireEnum(record, 'nativeSkillType', NATIVE_SKILL_TYPES_SET, path, out);
  requireNonNegativeInteger(record, 'timelineBlockFrames', path, out);
  if (record.timelineBlockFollowUpSkillId !== undefined) {
    requireString(record, 'timelineBlockFollowUpSkillId', path, out);
  }
  if (record.timelineContinuationSkillId !== undefined) {
    requireString(record, 'timelineContinuationSkillId', path, out);
  }
  if (record.naturalDurationFrames !== undefined) {
    requirePositiveInteger(record, 'naturalDurationFrames', path, out);
  }
  if (record.enhancementStateBuffId !== undefined) {
    requireString(record, 'enhancementStateBuffId', path, out);
  }

  if (record.blackboard !== undefined) {
    const blackboard = asRecord(record.blackboard, `${path}.blackboard`, out);
    if (blackboard !== null) {
      for (const [key, levelValue] of Object.entries(blackboard)) {
        validateLevelValues(levelValue, `${path}.blackboard.${key}`, out);
      }
    }
  }
  if (record.smartTarget !== undefined)
    requireEnum(record, 'smartTarget', new Set(['enemy', 'input', 'trigger']), path, out);

  if (record.availability !== undefined) {
    validateCombatCondition(record.availability, `${path}.availability`, out);
  }
  if (record.cooldownFrames !== undefined) {
    validateLevelValues(record.cooldownFrames, `${path}.cooldownFrames`, out);
  }
  if (record.costs !== undefined) {
    if (!Array.isArray(record.costs)) {
      push(out, `${path}.costs`, 'expected an array');
    } else {
      record.costs.forEach((cost, index) => {
        const costRecord = asRecord(cost, `${path}.costs[${index}]`, out);
        if (costRecord !== null) {
          requireEnum(costRecord, 'resource', COMBAT_RESOURCES_SET, `${path}.costs[${index}]`, out);
          validateLevelValues(costRecord.value, `${path}.costs[${index}].value`, out);
        }
      });
    }
  }
  if (record.costFrame !== undefined) {
    requireNonNegativeInteger(record, 'costFrame', path, out);
  }
  if (record.exclusiveFrame !== undefined) {
    requireNonNegativeInteger(record, 'exclusiveFrame', path, out);
  }
  if (record.inputWindows !== undefined) {
    const windows = asRecord(record.inputWindows, `${path}.inputWindows`, out);
    if (windows !== null) {
      if (windows.hasConditionalActions !== undefined)
        requireBoolean(windows, 'hasConditionalActions', `${path}.inputWindows`, out);
      for (const field of ['commandMappings', 'allowedNextSkills'] as const) {
        const value = windows[field];
        if (value === undefined) continue;
        if (!Array.isArray(value)) {
          push(out, `${path}.inputWindows.${field}`, 'expected an array');
          continue;
        }
        value.forEach((item, index) => {
          const itemPath = `${path}.inputWindows.${field}[${index}]`;
          const row = asRecord(item, itemPath, out);
          if (row === null) return;
          requireNonNegativeInteger(row, 'startFrame', itemPath, out);
          requireNonNegativeInteger(row, 'endFrame', itemPath, out);
          if (
            typeof row.startFrame === 'number' &&
            typeof row.endFrame === 'number' &&
            row.endFrame < row.startFrame
          )
            push(out, `${itemPath}.endFrame`, 'expected endFrame >= startFrame');
          if (field === 'commandMappings') {
            requireEnum(row, 'input', new Set(['basicAttack']), itemPath, out);
            if (row.targetSkillId !== null) requireString(row, 'targetSkillId', itemPath, out);
          } else if (!Array.isArray(row.skillIds)) {
            push(out, `${itemPath}.skillIds`, 'expected an array');
          } else {
            row.skillIds.forEach((skillId, sourceIndex) => {
              if (typeof skillId !== 'string' || skillId.length === 0)
                push(out, `${itemPath}.skillIds[${sourceIndex}]`, 'expected a non-empty string');
            });
          }
        });
      }
    }
  }
  if (record.switchToBuffCast !== undefined) {
    const route = asRecord(record.switchToBuffCast, `${path}.switchToBuffCast`, out);
    if (route !== null) {
      if (route.currentSkillTypes !== undefined && !Array.isArray(route.currentSkillTypes)) {
        push(out, `${path}.switchToBuffCast.currentSkillTypes`, 'expected an array');
      } else if (Array.isArray(route.currentSkillTypes)) {
        if (route.currentSkillTypes.length === 0)
          push(out, `${path}.switchToBuffCast.currentSkillTypes`, 'expected a non-empty array');
        route.currentSkillTypes.forEach((value, index) => {
          if (!SKILL_TYPES_SET.has(value as never)) {
            push(
              out,
              `${path}.switchToBuffCast.currentSkillTypes[${index}]`,
              'expected a known skill type',
            );
          }
        });
      }
      if (route.condition !== undefined)
        validateCombatCondition(route.condition, `${path}.switchToBuffCast.condition`, out);
      if (route.currentSkillTypes === undefined && route.condition === undefined)
        push(out, `${path}.switchToBuffCast`, 'expected currentSkillTypes or condition');
      if (
        route.requiresCurrentSkillNotInterruptible !== undefined &&
        typeof route.requiresCurrentSkillNotInterruptible !== 'boolean'
      ) {
        push(
          out,
          `${path}.switchToBuffCast.requiresCurrentSkillNotInterruptible`,
          'expected a boolean',
        );
      }
      if (
        route.requiresCurrentSkillNotInterruptible === true &&
        route.currentSkillTypes === undefined
      ) {
        push(
          out,
          `${path}.switchToBuffCast.requiresCurrentSkillNotInterruptible`,
          'requires currentSkillTypes',
        );
      }
      if (route.asSkillCast !== undefined && typeof route.asSkillCast !== 'boolean')
        push(out, `${path}.switchToBuffCast.asSkillCast`, 'expected a boolean');
      validateActionGraphReference(route.sequence, `${path}.switchToBuffCast.sequence`, out);
    }
  }
  if (record.scheduledSequences !== undefined) {
    if (!Array.isArray(record.scheduledSequences)) {
      push(out, `${path}.scheduledSequences`, 'expected an array');
    } else {
      record.scheduledSequences.forEach((sequence, index) => {
        validateScheduledSequence(sequence, `${path}.scheduledSequences[${index}]`, out);
      });
    }
  } else {
    push(out, `${path}.scheduledSequences`, 'expected an array');
  }

  if (record.eventHandlers !== undefined) {
    if (!Array.isArray(record.eventHandlers)) {
      push(out, `${path}.eventHandlers`, 'expected an array');
    } else {
      record.eventHandlers.forEach((handler, index) => {
        validateEventHandler(handler, `${path}.eventHandlers[${index}]`, out);
      });
    }
  }

  return out;
}
