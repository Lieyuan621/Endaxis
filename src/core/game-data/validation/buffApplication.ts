import { parseCombatBuffDefinitionEntry } from '../../combat/buffs/combatBuffDefinitions';
import type { ActionGraphContextEntry } from './actionPrograms';
import { validateActionGraphResource } from '../../action-graph/actionGraphValidation';
import type { ActionGraphResourceDefinition } from '../../../../packages/game-data-contract/src/actionGraph';
import {
  type SkillDefinitionValidationIssue,
  push,
  asRecord,
  requireString,
  requireFiniteNumber,
  requireBoolean,
  requireEnum,
  validateLevelValues,
  validateActionValueOperand,
  BUFF_APPLICATION_TARGETS_SET,
  BUFF_APPLICATION_SOURCES_SET,
  requireInteger,
} from './definitionValues';
interface BuffSequenceValidators {
  readonly action: (value: unknown, path: string, out: SkillDefinitionValidationIssue[]) => void;
  readonly scheduled: (value: unknown, path: string, out: SkillDefinitionValidationIssue[]) => void;
  /** 校验 Buff 自己的动作图；由调用方提供图动作校验，避免本模块反向依赖序列校验。 */
  readonly graph: (value: unknown, path: string, out: SkillDefinitionValidationIssue[]) => void;
  /** 从 Buff 的实际入口沿图校验实体上下文与监听器寿命。 */
  readonly contexts: (
    graph: unknown,
    path: string,
    entries: readonly ActionGraphContextEntry[],
    out: SkillDefinitionValidationIssue[],
  ) => void;
}
/** 安装动作只引用所属对象的 Buff 目录，不持有蓝图。 */
export function validateBuffApplication(
  parameters: Record<string, unknown>,
  path: string,
  out: SkillDefinitionValidationIssue[],
  currentTargetAvailable: boolean,
): void {
  if (parameters.sourceContextKey !== undefined) {
    requireString(parameters, 'sourceContextKey', `${path}.parameters`, out);
    if (parameters.source !== undefined)
      push(out, `${path}.parameters.source`, 'source and sourceContextKey are mutually exclusive');
  }
  const dynamicId = typeof parameters.buffId === 'object' && parameters.buffId !== null;
  if (!dynamicId) requireString(parameters, 'buffId', `${path}.parameters`, out);
  if (dynamicId) {
    const idPath = `${path}.parameters.buffId`;
    const reference = asRecord(parameters.buffId, idPath, out);
    if (reference !== null) {
      requireString(reference, 'blackboardKey', idPath, out);
      for (const key of Object.keys(reference)) {
        if (key !== 'blackboardKey') push(out, `${idPath}.${key}`, 'unexpected field');
      }
    }
    for (const field of ['durationSeconds', 'effectiveness']) {
      if (parameters[field] !== undefined)
        push(
          out,
          `${path}.parameters.${field}`,
          '动态 Buff ID 只能通过定义目录查表，不能使用内联或旧式覆盖',
        );
    }
  }
  if (parameters.iconDurationSource !== undefined) {
    const sourcePath = `${path}.parameters.iconDurationSource`;
    const source = asRecord(parameters.iconDurationSource, sourcePath, out);
    if (source !== null) {
      if (source.kind !== 'actionOwnerAbilityEntity' && source.kind !== 'actionOwnerTimedMarker')
        push(
          out,
          `${sourcePath}.kind`,
          "expected 'actionOwnerAbilityEntity' or 'actionOwnerTimedMarker'",
        );
      if (
        source.kind === 'actionOwnerTimedMarker' &&
        (typeof source.markerId !== 'string' || source.markerId.length === 0)
      )
        push(out, `${sourcePath}.markerId`, 'expected a non-empty string');
      for (const key of Object.keys(source)) {
        if (key !== 'kind' && !(source.kind === 'actionOwnerTimedMarker' && key === 'markerId'))
          push(out, `${sourcePath}.${key}`, 'unexpected field');
      }
    }
  }
  if ('definition' in parameters)
    push(out, `${path}.parameters.definition`, 'applyBuff must reference an owner Buff definition');
  requireEnum(parameters, 'target', BUFF_APPLICATION_TARGETS_SET, `${path}.parameters`, out);
  if (parameters.target === 'currentAbilityEntity' && !currentTargetAvailable) {
    push(out, path, 'currentAbilityEntity target requires a forEachContextTarget body');
  }
  if (parameters.count !== undefined) {
    validateActionValueOperand(parameters.count, `${path}.parameters.count`, out);
  }
  if (parameters.source !== undefined) {
    requireEnum(
      parameters,
      'source',
      new Set([...BUFF_APPLICATION_SOURCES_SET, 'battle']),
      `${path}.parameters`,
      out,
    );
    if (parameters.source === 'currentAbilityEntity' && !currentTargetAvailable) {
      push(out, path, 'currentAbilityEntity source requires a forEachContextTarget body');
    }
  }
  if (parameters.blackboardAssignments !== undefined) {
    const assignments = asRecord(
      parameters.blackboardAssignments,
      `${path}.parameters.blackboardAssignments`,
      out,
    );
    if (assignments !== null) {
      for (const [key, operand] of Object.entries(assignments)) {
        const assignmentPath = `${path}.parameters.blackboardAssignments.${key}`;
        if (typeof operand === 'number' || Array.isArray(operand))
          validateLevelValues(operand, assignmentPath, out);
        else validateActionValueOperand(operand, assignmentPath, out);
      }
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
        if (key.trim().length === 0)
          push(out, `${path}.parameters.stringBlackboardAssignments`, 'contains an empty key');
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
        if (key.trim().length === 0)
          push(out, `${path}.parameters.copiedBlackboardAssignments`, 'contains an empty key');
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
  if (parameters.inheritSourceSkillCastInfo !== undefined) {
    requireBoolean(parameters, 'inheritSourceSkillCastInfo', `${path}.parameters`, out);
  }
  if (parameters.isExtra !== undefined) {
    requireBoolean(parameters, 'isExtra', `${path}.parameters`, out);
  }
  if (parameters.finishByAction !== undefined) {
    requireBoolean(parameters, 'finishByAction', `${path}.parameters`, out);
  }
  if (parameters.onActionEndFinishBuffs !== undefined) {
    const cleanupPath = `${path}.parameters.onActionEndFinishBuffs`;
    const cleanup = asRecord(parameters.onActionEndFinishBuffs, cleanupPath, out);
    if (parameters.finishByAction !== true) push(out, cleanupPath, 'requires finishByAction');
    if (cleanup !== null) {
      requireEnum(cleanup, 'target', BUFF_APPLICATION_TARGETS_SET, cleanupPath, out);
      if (
        !Array.isArray(cleanup.buffIds) ||
        cleanup.buffIds.length === 0 ||
        cleanup.buffIds.some(id => typeof id !== 'string' || id.length === 0)
      ) {
        push(out, `${cleanupPath}.buffIds`, 'expected non-empty Buff IDs');
      }
    }
  }
  if (parameters.onActionEndBuffs !== undefined) {
    const exitPath = `${path}.parameters.onActionEndBuffs`;
    if (!Array.isArray(parameters.onActionEndBuffs)) {
      push(out, exitPath, 'expected an array');
    } else {
      if (parameters.onActionEndBuffs.length === 0)
        push(out, exitPath, 'expected at least one Buff');
      parameters.onActionEndBuffs.forEach((value, index) => {
        const itemPath = `${exitPath}[${index}]`;
        const item = asRecord(value, itemPath, out);
        if (item === null) return;
        requireString(item, 'buffId', itemPath, out);
        requireEnum(item, 'target', BUFF_APPLICATION_TARGETS_SET, itemPath, out);
        if (item.source !== undefined)
          requireEnum(item, 'source', BUFF_APPLICATION_SOURCES_SET, itemPath, out);
        if (item.blackboardAssignments !== undefined) {
          const assignments = asRecord(
            item.blackboardAssignments,
            `${itemPath}.blackboardAssignments`,
            out,
          );
          if (assignments !== null) {
            for (const [key, operand] of Object.entries(assignments)) {
              const assignmentPath = `${itemPath}.blackboardAssignments.${key}`;
              if (typeof operand === 'number' || Array.isArray(operand))
                validateLevelValues(operand, assignmentPath, out);
              else validateActionValueOperand(operand, assignmentPath, out);
            }
          }
        }
        if (item.stringBlackboardAssignments !== undefined) {
          const assignments = asRecord(
            item.stringBlackboardAssignments,
            `${itemPath}.stringBlackboardAssignments`,
            out,
          );
          if (assignments !== null) {
            for (const [key, assignment] of Object.entries(assignments)) {
              if (typeof assignment !== 'string' || assignment.length === 0)
                push(
                  out,
                  `${itemPath}.stringBlackboardAssignments.${key}`,
                  'expected a non-empty string',
                );
            }
          }
        }
        if (item.inheritSourceSkillCastInfo !== undefined)
          requireBoolean(item, 'inheritSourceSkillCastInfo', itemPath, out);
      });
    }
    if (parameters.finishByAction !== true) push(out, exitPath, 'requires finishByAction=true');
  }
  if (parameters.inheritToNextSkillIds !== undefined) {
    const inheritPath = `${path}.parameters.inheritToNextSkillIds`;
    if (!Array.isArray(parameters.inheritToNextSkillIds)) {
      push(out, inheritPath, 'expected an array');
    } else {
      if (parameters.inheritToNextSkillIds.length === 0)
        push(out, inheritPath, 'expected at least one skill ID');
      parameters.inheritToNextSkillIds.forEach((skillId, index) => {
        if (typeof skillId !== 'string' || skillId.length === 0)
          push(out, `${inheritPath}[${index}]`, 'expected a non-empty string');
      });
    }
    if (parameters.finishByAction !== true) {
      push(out, inheritPath, 'requires finishByAction=true');
    }
  }
  if (parameters.asChildBuff !== undefined) {
    requireBoolean(parameters, 'asChildBuff', `${path}.parameters`, out);
  }
  if (parameters.lifetimeOwner !== undefined) {
    requireEnum(
      parameters,
      'lifetimeOwner',
      new Set(['currentCastSkill']),
      `${path}.parameters`,
      out,
    );
  }
  if (parameters.durationSeconds !== undefined) {
    requireFiniteNumber(parameters, 'durationSeconds', `${path}.parameters`, out);
  }
  if (parameters.effectiveness !== undefined) {
    requireFiniteNumber(parameters, 'effectiveness', `${path}.parameters`, out);
  }
}

/** 独立 Buff 定义的校验，不通过伪造 applyBuff 动作进入。 */
export function validateBuffDefinition(
  value: unknown,
  buffId: string,
  path: string,
  out: SkillDefinitionValidationIssue[],
  sequences: BuffSequenceValidators,
): void {
  const definition = asRecord(value, path, out);
  if (definition !== null) {
    try {
      const {
        presentation,
        scheduledSequences,
        lifecycleSequences,
        abilityEventResponses,
        igniteEventResponses,
        skillSlotReplacements,
        actions,
        maxStackCount,
        actionGraph,
        ...runtimeDefinition
      } = definition;
      const runtimeDamageModifiers = Array.isArray(runtimeDefinition.damageModifiers)
        ? runtimeDefinition.damageModifiers.map((value, index) => {
            const modifierPath = `${path}.damageModifiers[${index}]`;
            const modifier = asRecord(value, modifierPath, out);
            if (modifier === null || modifier.conditionProgram === undefined) return value;
            if (modifier.condition !== undefined) {
              out.push({
                path: modifierPath,
                message: 'cannot define both condition and conditionProgram',
              });
            }
            sequences.action(modifier.conditionProgram, `${modifierPath}.conditionProgram`, out);
            const { conditionProgram: _, ...staticModifier } = modifier;
            return staticModifier;
          })
        : runtimeDefinition.damageModifiers;
      parseCombatBuffDefinitionEntry(
        {
          id: buffId,
          ...runtimeDefinition,
          ...(runtimeDamageModifiers === undefined
            ? {}
            : { damageModifiers: runtimeDamageModifiers }),
          ...(typeof maxStackCount === 'number' ? { maxStackCount } : {}),
        },
        `${path}`,
      );
      if (maxStackCount !== undefined && typeof maxStackCount !== 'number') {
        const maxStackPath = `${path}.maxStackCount`;
        const operand = asRecord(maxStackCount, maxStackPath, out);
        if (operand !== null) {
          requireString(operand, 'blackboardKey', maxStackPath, out);
          for (const key of Object.keys(operand)) {
            if (key !== 'blackboardKey') {
              push(out, `${maxStackPath}.${key}`, 'unexpected field');
            }
          }
        }
      }
      if (actions !== undefined) {
        push(out, `${path}.actions`, 'Buff definitions must use lifecycleSequences');
      }
      if (actionGraph !== undefined) {
        // 图与运行时属性分开校验：动作细节走序列校验器，入口/宏引用走契约校验器。
        sequences.graph(actionGraph, `${path}.actionGraph`, out);
        validateActionGraphResource(actionGraph as ActionGraphResourceDefinition);
        const entries: ActionGraphContextEntry[] = [];
        const recordOf = (value: unknown): Record<string, unknown> | null =>
          value !== null && typeof value === 'object' && !Array.isArray(value)
            ? (value as Record<string, unknown>)
            : null;
        const lifecycle = recordOf(lifecycleSequences);
        if (lifecycle !== null)
          for (const [key, sequence] of Object.entries(lifecycle))
            entries.push({
              reference: sequence,
              path: `${path}.lifecycleSequences.${key}`,
              currentTargetAvailable: false,
            });
        if (Array.isArray(scheduledSequences))
          scheduledSequences.forEach((sequence, index) => {
            const sequencePath = `${path}.scheduledSequences[${index}]`;
            const row = recordOf(sequence);
            entries.push({
              reference: row === null ? undefined : row.sequence,
              path: sequencePath,
              currentTargetAvailable: false,
              ...(row !== null && row.endFrame === undefined
                ? { missingListenerEndFramePath: `${sequencePath}.endFrame` }
                : {}),
            });
          });
        for (const [field, responses] of [
          ['abilityEventResponses', abilityEventResponses],
          ['igniteEventResponses', igniteEventResponses],
        ] as const) {
          if (!Array.isArray(responses)) continue;
          responses.forEach((value, index) => {
            const response = recordOf(value);
            if (response === null) return;
            entries.push({
              reference: response.sequence,
              path: `${path}.${field}[${index}].sequence`,
              currentTargetAvailable: false,
            });
          });
        }
        sequences.contexts(actionGraph, `${path}.actionGraph`, entries, out);
      }
      if (scheduledSequences !== undefined) {
        const scheduledPath = `${path}.scheduledSequences`;
        if (!Array.isArray(scheduledSequences)) {
          push(out, scheduledPath, 'expected an array');
        } else {
          scheduledSequences.forEach((sequence, index) =>
            sequences.scheduled(sequence, `${scheduledPath}[${index}]`, out),
          );
        }
      }
      if (lifecycleSequences !== undefined) {
        const lifecyclePath = `${path}.lifecycleSequences`;
        const lifecycle = asRecord(lifecycleSequences, lifecyclePath, out);
        if (lifecycle !== null) {
          const supported = new Set([
            'start',
            'enable',
            'disable',
            'beforeEnhance',
            'trigger',
            'enhanceChanged',
            'afterEnhance',
            'finish',
          ]);
          for (const [key, sequence] of Object.entries(lifecycle)) {
            if (!supported.has(key)) {
              push(out, `${lifecyclePath}.${key}`, 'unknown Buff lifecycle sequence');
              continue;
            }
            sequences.action(sequence, `${lifecyclePath}.${key}`, out);
          }
        }
      }
      if (abilityEventResponses !== undefined) {
        const responsesPath = `${path}.abilityEventResponses`;
        if (!Array.isArray(abilityEventResponses)) {
          push(out, responsesPath, 'expected an array');
        } else {
          for (const [index, value] of abilityEventResponses.entries()) {
            const responsePath = `${responsesPath}[${index}]`;
            const response = asRecord(value, responsePath, out);
            if (response === null) continue;
            for (const key of Object.keys(response)) {
              if (!['event', 'priority', 'sequence'].includes(key)) {
                push(out, `${responsePath}.${key}`, 'unknown Buff ability event field');
              }
            }
            if (
              response.event !== 'enterFight' &&
              response.event !== 'ownerHpZero' &&
              response.event !== 'hpChanged' &&
              response.event !== 'beforeTakeDamage' &&
              response.event !== 'beforeCalculateDamage' &&
              response.event !== 'beforeTakePhysicalInfliction' &&
              response.event !== 'beforeOutputPhysicalInfliction' &&
              response.event !== 'afterOutputPhysicalInfliction' &&
              response.event !== 'beforeOutputKnockDown' &&
              response.event !== 'afterOutputKnockDown' &&
              response.event !== 'beforeOutputInfliction' &&
              response.event !== 'beforeOutputSpellBurst' &&
              response.event !== 'beforeTakeSpellInfliction' &&
              response.event !== 'beforeTakeInfliction' &&
              response.event !== 'takeDamage' &&
              response.event !== 'takeCriticalDamage' &&
              response.event !== 'outputDamage' &&
              response.event !== 'outputCriticalDamage' &&
              response.event !== 'outputKnockDown' &&
              response.event !== 'outputHeal' &&
              response.event !== 'receiveHeal' &&
              response.event !== 'poiseZero' &&
              response.event !== 'beforeCastSkill' &&
              response.event !== 'skillEnd' &&
              response.event !== 'beforeOutputBuff' &&
              response.event !== 'beforeAddedBuff' &&
              response.event !== 'outputBuff' &&
              response.event !== 'addedBuff' &&
              response.event !== 'finishedBuff' &&
              response.event !== 'afterOutputWeaknessTriggered' &&
              response.event !== 'afterKillEntity' &&
              response.event !== 'buffConsumed' &&
              response.event !== 'skillSpGained'
            ) {
              push(out, `${responsePath}.event`, 'unsupported Buff ability event');
            }
            requireInteger(response, 'priority', responsePath, out);
            sequences.action(response.sequence, `${responsePath}.sequence`, out);
          }
        }
      }
      if (igniteEventResponses !== undefined) {
        const responsesPath = `${path}.igniteEventResponses`;
        if (!Array.isArray(igniteEventResponses)) {
          push(out, responsesPath, 'expected an array');
        } else {
          for (const [index, value] of igniteEventResponses.entries()) {
            const responsePath = `${responsesPath}[${index}]`;
            const response = asRecord(value, responsePath, out);
            if (response === null) continue;
            for (const key of Object.keys(response)) {
              if (!['igniteType', 'finishAfterIgnited', 'sequence'].includes(key)) {
                push(out, `${responsePath}.${key}`, 'unknown Buff ignite event field');
              }
            }
            requireString(response, 'igniteType', responsePath, out);
            if (typeof response.finishAfterIgnited !== 'boolean') {
              push(out, `${responsePath}.finishAfterIgnited`, 'expected boolean');
            }
            sequences.action(response.sequence, `${responsePath}.sequence`, out);
          }
        }
      }
      if (skillSlotReplacements !== undefined) {
        const replacementsPath = `${path}.skillSlotReplacements`;
        if (!Array.isArray(skillSlotReplacements)) {
          push(out, replacementsPath, 'expected an array');
        } else {
          for (const [index, value] of skillSlotReplacements.entries()) {
            const replacementPath = `${replacementsPath}[${index}]`;
            const replacement = asRecord(value, replacementPath, out);
            if (replacement === null) continue;
            for (const key of Object.keys(replacement)) {
              if (
                ![
                  'skillGroupKey',
                  'targetSkillKey',
                  'revertedSkillKey',
                  'inheritOriginSkillCooldownProgress',
                ].includes(key)
              ) {
                push(out, `${replacementPath}.${key}`, 'unknown skill slot replacement field');
              }
            }
            requireString(replacement, 'skillGroupKey', replacementPath, out);
            requireString(replacement, 'targetSkillKey', replacementPath, out);
            requireString(replacement, 'revertedSkillKey', replacementPath, out);
            if (typeof replacement.inheritOriginSkillCooldownProgress !== 'boolean') {
              push(
                out,
                `${replacementPath}.inheritOriginSkillCooldownProgress`,
                'expected a boolean',
              );
            }
          }
        }
      }
      if (presentation !== undefined) {
        const presentationRecord = asRecord(presentation, `${path}.presentation`, out);
        if (presentationRecord !== null) {
          for (const key of Object.keys(presentationRecord)) {
            if (
              ![
                'iconId',
                'iconPath',
                'visible',
                'showInHeadBarCommon',
                'showInHeadBarAttached',
                'showInSquadIcon',
                'onlyShowForMainCharacter',
                'blinkInMainCharHpBar',
                'showProgressInHpBar',
                'showProgressInNormalSkillButton',
                'useWeakProgressInNormalSkillButton',
                'showProgressInUltimateSkillButton',
                'forceRaiseIconEvent',
                'showWarningBackground',
                'playStrongInAnimation',
                'hasCharHpBarVfxType',
                'charHpBarVfxType',
                'iconStyleInSquad',
                'abnormalColorType',
                'orderPriority',
              ].includes(key)
            ) {
              push(out, `${path}.presentation.${key}`, 'unknown Buff presentation field');
            }
          }
          if (presentationRecord.iconPath !== undefined) {
            requireString(presentationRecord, 'iconPath', `${path}.presentation`, out);
          }
          for (const key of [
            'iconId',
            'iconStyleInSquad',
            'abnormalColorType',
            'charHpBarVfxType',
          ]) {
            if (presentationRecord[key] !== undefined) {
              requireString(presentationRecord, key, `${path}.presentation`, out);
            }
          }
          for (const key of [
            'visible',
            'showInHeadBarCommon',
            'showInHeadBarAttached',
            'showInSquadIcon',
            'onlyShowForMainCharacter',
            'blinkInMainCharHpBar',
            'showProgressInHpBar',
            'showProgressInNormalSkillButton',
            'useWeakProgressInNormalSkillButton',
            'showProgressInUltimateSkillButton',
            'forceRaiseIconEvent',
            'showWarningBackground',
            'playStrongInAnimation',
            'hasCharHpBarVfxType',
          ]) {
            if (presentationRecord[key] !== undefined) {
              requireBoolean(presentationRecord, key, `${path}.presentation`, out);
            }
          }
          if (presentationRecord.orderPriority !== undefined) {
            const order = asRecord(
              presentationRecord.orderPriority,
              `${path}.presentation.orderPriority`,
              out,
            );
            if (order !== null) {
              for (const key of Object.keys(order)) {
                if (!['useDirectoryValue', 'value', 'category'].includes(key)) {
                  push(
                    out,
                    `${path}.presentation.orderPriority.${key}`,
                    'unknown Buff icon order field',
                  );
                }
              }
              requireBoolean(order, 'useDirectoryValue', `${path}.presentation.orderPriority`, out);
              requireFiniteNumber(order, 'value', `${path}.presentation.orderPriority`, out);
              requireString(order, 'category', `${path}.presentation.orderPriority`, out);
            }
          }
        }
      }
    } catch (error) {
      push(out, `${path}`, error instanceof Error ? error.message : 'invalid Buff definition');
    }
  }
}
