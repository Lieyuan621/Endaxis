import { parseCombatBuffDefinitionEntry } from '../../combat/buffs/combatBuffDefinitions';
import { validateTargetQuery } from './combatConditions';
import type { ActionGraphContextEntry } from './actionPrograms';
import { validateActionGraphResource } from '../../action-graph/actionGraphValidation';
import type { ActionGraphResourceDefinition } from '../../../../packages/game-data-contract/src/actionGraph';
import {
  type SkillDefinitionValidationIssue,
  push,
  asRecord,
  requireString,
  requireBoolean,
  requireEnum,
  validateLevelValues,
  validateActionValueOperand,
  validateActionStringOperand,
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
  host: 'applyBuff' | 'aura' = 'applyBuff',
): void {
  if (!Array.isArray(parameters.buffs) || (host === 'applyBuff' && parameters.buffs.length === 0)) {
    push(out, `${path}.parameters.buffs`, 'expected a non-empty Buff list');
  } else {
    parameters.buffs.forEach((value, index) => {
      const itemPath = `${path}.parameters.buffs[${index}]`;
      const entry = asRecord(value, itemPath, out);
      if (entry === null) return;
      validateActionStringOperand(entry.buffId, `${itemPath}.buffId`, out);

      if (entry.blackboardAssignments !== undefined) {
        const assignments = asRecord(
          entry.blackboardAssignments,
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
      if (entry.stringBlackboardAssignments !== undefined) {
        const assignments = asRecord(
          entry.stringBlackboardAssignments,
          `${itemPath}.stringBlackboardAssignments`,
          out,
        );
        if (assignments !== null) {
          for (const [key, value] of Object.entries(assignments)) {
            if (key.trim().length === 0)
              push(out, `${itemPath}.stringBlackboardAssignments`, 'contains an empty key');
            if (typeof value !== 'string' || value.trim().length === 0) {
              push(
                out,
                `${itemPath}.stringBlackboardAssignments.${key}`,
                'expected a non-empty string',
              );
            }
          }
        }
      }
      if (entry.copiedBlackboardAssignments !== undefined) {
        const assignments = asRecord(
          entry.copiedBlackboardAssignments,
          `${itemPath}.copiedBlackboardAssignments`,
          out,
        );
        if (assignments !== null) {
          for (const [key, value] of Object.entries(assignments)) {
            if (key.trim().length === 0)
              push(out, `${itemPath}.copiedBlackboardAssignments`, 'contains an empty key');
            if (typeof value !== 'string' || value.trim().length === 0) {
              push(
                out,
                `${itemPath}.copiedBlackboardAssignments.${key}`,
                'expected a non-empty source key',
              );
            }
          }
        }
      }
    });
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
  validateTargetQuery(parameters.targets, `${path}.parameters.targets`, out);
  if (parameters.source !== undefined)
    validateTargetQuery(parameters.source, `${path}.parameters.source`, out);
  for (const removed of ['target', 'sourceContextKey']) {
    if (removed in parameters)
      push(out, `${path}.parameters.${removed}`, 'use action target queries');
  }
  if (parameters.count !== undefined) {
    validateActionValueOperand(parameters.count, `${path}.parameters.count`, out);
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
  for (const field of ['durationSeconds', 'effectiveness']) {
    if (parameters[field] !== undefined)
      push(
        out,
        `${path}.parameters.${field}`,
        'use the Buff definition and blackboard assignments',
      );
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
      for (const kind of ['damageModifiers', 'healModifiers', 'poiseModifiers'] as const) {
        const modifiers = runtimeDefinition[kind];
        if (!Array.isArray(modifiers)) continue;
        modifiers.forEach((value, index) => {
          const modifierPath = `${path}.${kind}[${index}]`;
          const modifier = asRecord(value, modifierPath, out);
          if (modifier?.condition !== undefined)
            sequences.action(modifier.condition, `${modifierPath}.condition`, out);
        });
      }
      parseCombatBuffDefinitionEntry(
        {
          id: buffId,
          ...runtimeDefinition,
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
          for (const [key, list] of Object.entries(lifecycle))
            if (Array.isArray(list))
              list.forEach((sequence, index) =>
                entries.push({
                  reference: sequence,
                  path: `${path}.lifecycleSequences.${key}[${index}]`,
                  currentTargetAvailable: false,
                }),
              );
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
            const references =
              field === 'abilityEventResponses'
                ? [{ reference: response.sequence, path: `${path}.${field}[${index}].sequence` }]
                : Array.isArray(response.sequences)
                  ? response.sequences.map((reference, sequenceIndex) => ({
                      reference,
                      path: `${path}.${field}[${index}].sequences[${sequenceIndex}]`,
                    }))
                  : [];
            entries.push(...references.map(entry => ({ ...entry, currentTargetAvailable: false })));
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
            'dispelled',
            'release',
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
            if (!Array.isArray(sequence)) push(out, `${lifecyclePath}.${key}`, 'expected an array');
            else
              sequence.forEach((entry, index) =>
                sequences.action(entry, `${lifecyclePath}.${key}[${index}]`, out),
              );
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
              response.event !== 'afterTakeSpellInfliction' &&
              response.event !== 'beforeTakeSpellAbnormal' &&
              response.event !== 'afterTakeSpellAbnormal' &&
              response.event !== 'squadTakeSpellAbnormal' &&
              response.event !== 'beforeTakeInfliction' &&
              response.event !== 'takeDamage' &&
              response.event !== 'takeCriticalDamage' &&
              response.event !== 'outputDamage' &&
              response.event !== 'outputCriticalDamage' &&
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
              if (!['igniteType', 'finishAfterIgnited', 'sequences'].includes(key)) {
                push(out, `${responsePath}.${key}`, 'unknown Buff ignite event field');
              }
            }
            requireString(response, 'igniteType', responsePath, out);
            if (typeof response.finishAfterIgnited !== 'boolean') {
              push(out, `${responsePath}.finishAfterIgnited`, 'expected boolean');
            }
            if (!Array.isArray(response.sequences))
              push(out, `${responsePath}.sequences`, 'expected an array');
            else
              response.sequences.forEach((entry, sequenceIndex) =>
                sequences.action(entry, `${responsePath}.sequences[${sequenceIndex}]`, out),
              );
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
                  'skillSlotKey',
                  'targetSkillKey',
                  'revertedSkillKey',
                  'inheritOriginSkillCooldownProgress',
                ].includes(key)
              ) {
                push(out, `${replacementPath}.${key}`, 'unknown skill slot replacement field');
              }
            }
            requireString(replacement, 'skillSlotKey', replacementPath, out);
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
                'icon',
                'visible',
                'showInHeadBarCommon',
                'showInHeadBarAttached',
                'showInSquadIcon',
                'iconStyleInSquad',
                'abnormalColorType',
              ].includes(key)
            ) {
              push(out, `${path}.presentation.${key}`, 'unknown Buff presentation field');
            }
          }
          if (presentationRecord.icon !== undefined) {
            requireString(presentationRecord, 'icon', `${path}.presentation`, out);
          }
          for (const key of ['iconStyleInSquad', 'abnormalColorType']) {
            if (presentationRecord[key] !== undefined) {
              requireString(presentationRecord, key, `${path}.presentation`, out);
            }
          }
          for (const key of [
            'visible',
            'showInHeadBarCommon',
            'showInHeadBarAttached',
            'showInSquadIcon',
          ]) {
            if (presentationRecord[key] !== undefined) {
              requireBoolean(presentationRecord, key, `${path}.presentation`, out);
            }
          }
        }
      }
    } catch (error) {
      push(out, `${path}`, error instanceof Error ? error.message : 'invalid Buff definition');
    }
  }
}
