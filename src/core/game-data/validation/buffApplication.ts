import { parseCombatBuffDefinitionEntry } from '../../combat/buffs/combatBuffDefinitions';
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
  readonly action: (
    value: unknown,
    path: string,
    out: SkillDefinitionValidationIssue[],
    currentTargetAvailable?: boolean,
  ) => void;
  readonly scheduled: (
    value: unknown,
    path: string,
    out: SkillDefinitionValidationIssue[],
    currentTargetAvailable?: boolean,
  ) => void;
}
/** 校验 Buff 安装参数与内联定义；嵌套程序由调用方沿同一递归入口校验。 */
export function validateBuffApplication(
  parameters: Record<string, unknown>,
  path: string,
  out: SkillDefinitionValidationIssue[],
  currentTargetAvailable: boolean,
  sequences: BuffSequenceValidators,
): void {
  if (parameters.sourceContextKey !== undefined) {
    requireString(parameters, 'sourceContextKey', `${path}.parameters`, out);
    if (parameters.source !== undefined)
      push(out, `${path}.parameters.source`, 'source and sourceContextKey are mutually exclusive');
  }
  const dynamicId = typeof parameters.buffId === 'object' && parameters.buffId !== null;
  const buffId = dynamicId ? null : requireString(parameters, 'buffId', `${path}.parameters`, out);
  if (dynamicId) {
    const idPath = `${path}.parameters.buffId`;
    const reference = asRecord(parameters.buffId, idPath, out);
    if (reference !== null) {
      requireString(reference, 'blackboardKey', idPath, out);
      for (const key of Object.keys(reference)) {
        if (key !== 'blackboardKey') push(out, `${idPath}.${key}`, 'unexpected field');
      }
    }
    for (const field of ['definition', 'durationSeconds', 'effectiveness']) {
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
  if (parameters.definition !== undefined && buffId !== null) {
    const definition = asRecord(parameters.definition, `${path}.parameters.definition`, out);
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
          ...runtimeDefinition
        } = definition;
        const runtimeDamageModifiers = Array.isArray(runtimeDefinition.damageModifiers)
          ? runtimeDefinition.damageModifiers.map((value, index) => {
              const modifierPath = `${path}.parameters.definition.damageModifiers[${index}]`;
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
          `${path}.parameters.definition`,
        );
        if (maxStackCount !== undefined && typeof maxStackCount !== 'number') {
          const maxStackPath = `${path}.parameters.definition.maxStackCount`;
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
          push(
            out,
            `${path}.parameters.definition.actions`,
            'inline Buff definitions must use lifecycleSequences',
          );
        }
        if (scheduledSequences !== undefined) {
          const scheduledPath = `${path}.parameters.definition.scheduledSequences`;
          if (!Array.isArray(scheduledSequences)) {
            push(out, scheduledPath, 'expected an array');
          } else {
            scheduledSequences.forEach((sequence, index) =>
              sequences.scheduled(sequence, `${scheduledPath}[${index}]`, out),
            );
          }
        }
        if (lifecycleSequences !== undefined) {
          const lifecyclePath = `${path}.parameters.definition.lifecycleSequences`;
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
          const responsesPath = `${path}.parameters.definition.abilityEventResponses`;
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
          const responsesPath = `${path}.parameters.definition.igniteEventResponses`;
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
          const replacementsPath = `${path}.parameters.definition.skillSlotReplacements`;
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
        if (
          ((Array.isArray(scheduledSequences) && scheduledSequences.length > 0) ||
            (lifecycleSequences !== undefined &&
              typeof lifecycleSequences === 'object' &&
              lifecycleSequences !== null &&
              Object.keys(lifecycleSequences).length > 0) ||
            (Array.isArray(abilityEventResponses) && abilityEventResponses.length > 0) ||
            (Array.isArray(igniteEventResponses) && igniteEventResponses.length > 0) ||
            (Array.isArray(skillSlotReplacements) && skillSlotReplacements.length > 0)) &&
          parameters.inheritSourceSkillCastInfo !== true
        ) {
          push(
            out,
            `${path}.parameters.inheritSourceSkillCastInfo`,
            'Buff runtime sequences require inherited skill-cast info',
          );
        }
        if (presentation !== undefined) {
          const presentationRecord = asRecord(
            presentation,
            `${path}.parameters.definition.presentation`,
            out,
          );
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
                push(
                  out,
                  `${path}.parameters.definition.presentation.${key}`,
                  'unknown Buff presentation field',
                );
              }
            }
            if (presentationRecord.iconPath !== undefined) {
              requireString(
                presentationRecord,
                'iconPath',
                `${path}.parameters.definition.presentation`,
                out,
              );
            }
            for (const key of [
              'iconId',
              'iconStyleInSquad',
              'abnormalColorType',
              'charHpBarVfxType',
            ]) {
              if (presentationRecord[key] !== undefined) {
                requireString(
                  presentationRecord,
                  key,
                  `${path}.parameters.definition.presentation`,
                  out,
                );
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
                requireBoolean(
                  presentationRecord,
                  key,
                  `${path}.parameters.definition.presentation`,
                  out,
                );
              }
            }
            if (presentationRecord.orderPriority !== undefined) {
              const order = asRecord(
                presentationRecord.orderPriority,
                `${path}.parameters.definition.presentation.orderPriority`,
                out,
              );
              if (order !== null) {
                for (const key of Object.keys(order)) {
                  if (!['useDirectoryValue', 'value', 'category'].includes(key)) {
                    push(
                      out,
                      `${path}.parameters.definition.presentation.orderPriority.${key}`,
                      'unknown Buff icon order field',
                    );
                  }
                }
                requireBoolean(
                  order,
                  'useDirectoryValue',
                  `${path}.parameters.definition.presentation.orderPriority`,
                  out,
                );
                requireFiniteNumber(
                  order,
                  'value',
                  `${path}.parameters.definition.presentation.orderPriority`,
                  out,
                );
                requireString(
                  order,
                  'category',
                  `${path}.parameters.definition.presentation.orderPriority`,
                  out,
                );
              }
            }
          }
        }
      } catch (error) {
        push(
          out,
          `${path}.parameters.definition`,
          error instanceof Error ? error.message : 'invalid Buff definition',
        );
      }
    }
  }
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
