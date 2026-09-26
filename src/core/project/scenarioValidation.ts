import type { SkillBuffDefinition } from '../../../packages/game-data-contract/src/buffs.ts';
import { GLOBAL_CONFIG_PRESETS } from './globalConfigPresets';

import { validateActionGraphOwner } from '../action-graph/actionGraphValidation';
import {
  validateActionGraphReference,
  validateScheduledSequence,
  validateActionGraphActions,
  validateActionGraphContexts,
} from '../game-data/validation/actionPrograms';
import { validateBuffDefinition } from '../game-data/validation/buffApplication';
/**
 * 顶层项目校验器使用的场景内部一致性规则。
 * 这里只检查持久化结构和引用关系，不应调用游戏数据或执行战斗规则。
 */
import { ENEMY_EDITABLE_FIELDS, GLOBAL_OPERATOR_STAT_MODIFIERS, type JsonObject } from './schema';
import { SKILL_TYPES } from '../game-data/operatorDefinition';
import { ENEMY_RANKS } from '../game-data/enemyRank';
import {
  isObject,
  requireBoolean,
  requireFiniteNumber,
  requireNonNegativeInteger,
  requirePositiveInteger,
  requireString,
  validateEditedFields,
  validateFiniteNumberRecord,
  type ValidationIssue,
} from './validationHelpers';

const enemyEditableFields = new Set<string>(ENEMY_EDITABLE_FIELDS);
const globalOperatorStatModifiers = new Set<string>(GLOBAL_OPERATOR_STAT_MODIFIERS);
const skillTypes = new Set<string>(SKILL_TYPES);
const enemyRanks = new Set<string>(ENEMY_RANKS);

export function validateOperatorInstance(
  value: JsonObject,
  path: string,
  issues: ValidationIssue[],
): void {
  requireString(value, 'operatorSlug', path, issues);
  requirePositiveInteger(value.level, `${path}.level`, issues);
  requireBoolean(value.promoted, `${path}.promoted`, issues);
  requireNonNegativeInteger(value.potential, `${path}.potential`, issues);
  requireNonNegativeInteger(value.trustLevel, `${path}.trustLevel`, issues);
  validateFiniteNumberRecord(value.skillLevels, `${path}.skillLevels`, issues);
  validateFiniteNumberRecord(value.talentStates, `${path}.talentStates`, issues);
  if (value.baseStatOverrides !== undefined) {
    validateFiniteNumberRecord(value.baseStatOverrides, `${path}.baseStatOverrides`, issues);
  }
}

export function validateWeaponInstance(
  value: JsonObject,
  path: string,
  issues: ValidationIssue[],
): void {
  requireString(value, 'weaponSlug', path, issues);
  requirePositiveInteger(value.level, `${path}.level`, issues);
  requireBoolean(value.tuned, `${path}.tuned`, issues);
  requireNonNegativeInteger(value.potential, `${path}.potential`, issues);
  if (!Array.isArray(value.traitLevels)) {
    issues.push({ path: `${path}.traitLevels`, message: 'expected an array' });
  } else {
    value.traitLevels.forEach((level, index) =>
      requirePositiveInteger(level, `${path}.traitLevels[${index}]`, issues),
    );
  }
}

export function validateGearInstance(
  value: JsonObject,
  path: string,
  issues: ValidationIssue[],
): void {
  requireString(value, 'gearSlug', path, issues);
  if (!Array.isArray(value.artificingLevels)) {
    issues.push({ path: `${path}.artificingLevels`, message: 'expected an array' });
  } else {
    value.artificingLevels.forEach((level, index) =>
      requireNonNegativeInteger(level, `${path}.artificingLevels[${index}]`, issues),
    );
  }
}

export function validateEnemy(value: unknown, path: string, issues: ValidationIssue[]): void {
  if (!isObject(value)) {
    issues.push({ path, message: 'expected an object' });
    return;
  }
  if (!isObject(value.source)) {
    issues.push({ path: `${path}.source`, message: 'expected an object' });
  } else if (value.source.kind === 'prefab') {
    requireString(value.source, 'enemyId', `${path}.source`, issues);
    requirePositiveInteger(value.source.level, `${path}.source.level`, issues);
  } else if (value.source.kind === 'custom') {
    requirePositiveInteger(value.source.level, `${path}.source.level`, issues);
  } else {
    issues.push({ path: `${path}.source.kind`, message: 'unknown enemy source kind' });
  }
  if (typeof value.rank !== 'string' || !enemyRanks.has(value.rank)) {
    issues.push({ path: `${path}.rank`, message: 'unknown enemy rank' });
  }

  if (!isObject(value.editable)) {
    issues.push({ path: `${path}.editable`, message: 'expected an object' });
  } else {
    for (const field of ['hp', 'defense', 'superArmor', 'finisherMultiplier']) {
      requireFiniteNumber(value.editable[field], `${path}.editable.${field}`, issues);
    }
    validateFiniteNumberRecord(value.editable.resistances, `${path}.editable.resistances`, issues);
    if (!isObject(value.editable.stagger)) {
      issues.push({ path: `${path}.editable.stagger`, message: 'expected an object' });
    } else {
      requireFiniteNumber(
        value.editable.stagger.maximum,
        `${path}.editable.stagger.maximum`,
        issues,
      );
      if (!Array.isArray(value.editable.stagger.knotThresholds)) {
        issues.push({
          path: `${path}.editable.stagger.knotThresholds`,
          message: 'expected an array',
        });
      } else {
        let previous = 0;
        value.editable.stagger.knotThresholds.forEach((threshold, index) => {
          requireFiniteNumber(
            threshold,
            `${path}.editable.stagger.knotThresholds[${index}]`,
            issues,
          );
          if (typeof threshold === 'number' && (threshold <= previous || threshold >= 1)) {
            issues.push({
              path: `${path}.editable.stagger.knotThresholds[${index}]`,
              message: 'thresholds must increase and stay between 0 and 1',
            });
          }
          if (typeof threshold === 'number') previous = threshold;
        });
      }
      for (const field of ['knotBreakDurationFrames', 'brokenDurationFrames']) {
        requireNonNegativeInteger(
          value.editable.stagger[field],
          `${path}.editable.stagger.${field}`,
          issues,
        );
      }
      requireFiniteNumber(
        value.editable.stagger.finisherSpRecovery,
        `${path}.editable.stagger.finisherSpRecovery`,
        issues,
      );
    }
  }
  validateEditedFields(value.edited, enemyEditableFields, `${path}.edited`, issues);
}

export function validateBattle(value: unknown, path: string, issues: ValidationIssue[]): void {
  if (!isObject(value)) {
    issues.push({ path, message: 'expected an object' });
    return;
  }
  requireNonNegativeInteger(value.prepFrames, `${path}.prepFrames`, issues);
  requirePositiveInteger(value.durationFrames, `${path}.durationFrames`, issues);

  if (value.random !== undefined) {
    const randomPath = `${path}.random`;
    if (!isObject(value.random)) {
      issues.push({ path: randomPath, message: 'expected an object' });
    } else {
      if (value.random.mode !== 'expected' && value.random.mode !== 'sampled') {
        issues.push({ path: `${randomPath}.mode`, message: 'expected expected or sampled' });
      }
      const seed = value.random.globalSeed;
      if (!Number.isInteger(seed) || (seed as number) < 0 || (seed as number) > 0xffffffff) {
        issues.push({
          path: `${randomPath}.globalSeed`,
          message: 'expected a 32-bit unsigned integer',
        });
      }
    }
  }

  if (value.simulationRange !== undefined) {
    const rangePath = `${path}.simulationRange`;
    if (!isObject(value.simulationRange)) {
      issues.push({ path: rangePath, message: 'expected an object' });
    } else {
      if (value.simulationRange.startFrame !== undefined) {
        requireNonNegativeInteger(
          value.simulationRange.startFrame,
          `${rangePath}.startFrame`,
          issues,
        );
      }
      if (value.simulationRange.endFrame !== undefined) {
        requireNonNegativeInteger(value.simulationRange.endFrame, `${rangePath}.endFrame`, issues);
      }
      if (
        typeof value.simulationRange.startFrame === 'number' &&
        typeof value.simulationRange.endFrame === 'number' &&
        value.simulationRange.endFrame < value.simulationRange.startFrame
      ) {
        issues.push({ path: `${rangePath}.endFrame`, message: 'must not precede startFrame' });
      }
    }
  }

  if (!isObject(value.resourceRules)) {
    issues.push({ path: `${path}.resourceRules`, message: 'expected an object' });
  } else {
    for (const field of ['maxSp', 'initialSp', 'spRecoveryPerSecond', 'defaultSkillSpCost']) {
      requireFiniteNumber(value.resourceRules[field], `${path}.resourceRules.${field}`, issues);
    }
    if (
      typeof value.resourceRules.maxSp === 'number' &&
      typeof value.resourceRules.initialSp === 'number' &&
      value.resourceRules.initialSp > value.resourceRules.maxSp
    ) {
      issues.push({
        path: `${path}.resourceRules.initialSp`,
        message: 'must not exceed maxSp',
      });
    }
  }

  const validateTimedEntries = (
    entries: unknown,
    entriesPath: string,
    validateEntry: (entry: JsonObject, entryPath: string) => void,
    minimumFrame = 0,
  ) => {
    if (!Array.isArray(entries)) {
      issues.push({ path: entriesPath, message: 'expected an array' });
      return;
    }
    const ids = new Set<string>();
    entries.forEach((entry, index) => {
      const entryPath = `${entriesPath}[${index}]`;
      if (!isObject(entry)) {
        issues.push({ path: entryPath, message: 'expected an object' });
        return;
      }
      const id = requireString(entry, 'id', entryPath, issues);
      if (id !== null && ids.has(id)) {
        issues.push({ path: `${entryPath}.id`, message: 'duplicate timed entry id' });
      }
      if (id !== null) ids.add(id);
      if (
        typeof entry.frame !== 'number' ||
        !Number.isInteger(entry.frame) ||
        entry.frame < minimumFrame
      ) {
        issues.push({
          path: `${entryPath}.frame`,
          message:
            minimumFrame < 0
              ? `expected an integer no earlier than ${minimumFrame}`
              : 'expected a non-negative integer',
        });
      }
      validateEntry(entry, entryPath);
    });
  };

  validateTimedEntries(value.cycleBoundaries, `${path}.cycleBoundaries`, () => {});
  validateTimedEntries(
    value.controlSwitches,
    `${path}.controlSwitches`,
    (entry, entryPath) => {
      if (![0, 1, 2, 3].includes(entry.trackIndex as number)) {
        issues.push({
          path: `${entryPath}.trackIndex`,
          message: 'expected a track index from 0 to 3',
        });
      }
    },
    typeof value.prepFrames === 'number' && Number.isInteger(value.prepFrames)
      ? -Math.max(0, value.prepFrames)
      : 0,
  );
  if (value.externalEventMarkers !== undefined) {
    validateTimedEntries(
      value.externalEventMarkers,
      `${path}.externalEventMarkers`,
      (entry, entryPath) => {
        if (!isObject(entry.target)) {
          issues.push({ path: `${entryPath}.target`, message: 'expected an object' });
        } else if (entry.target.scope === 'operator') {
          if (![0, 1, 2, 3].includes(entry.target.trackIndex as number)) {
            issues.push({
              path: `${entryPath}.target.trackIndex`,
              message: 'expected a track index from 0 to 3',
            });
          }
        } else if (entry.target.scope !== 'team') {
          issues.push({ path: `${entryPath}.target.scope`, message: 'unknown event target scope' });
        }
        if (!isObject(entry.event)) {
          issues.push({ path: `${entryPath}.event`, message: 'expected an object' });
          return;
        }
        if (entry.event.kind !== 'comboCooldownControl') {
          issues.push({ path: `${entryPath}.event.kind`, message: 'unknown external event kind' });
          return;
        }
        if (entry.event.mode !== 'cooldown' && entry.event.mode !== 'ready') {
          issues.push({
            path: `${entryPath}.event.mode`,
            message: 'unknown cooldown control mode',
          });
        }
        if (!isObject(entry.target) || entry.target.scope !== 'team') {
          issues.push({
            path: `${entryPath}.target.scope`,
            message: 'cooldown control requires team scope',
          });
        }
      },
    );
  }
  if (value.dodgeMarkers !== undefined) {
    validateTimedEntries(
      value.dodgeMarkers,
      `${path}.dodgeMarkers`,
      (entry, entryPath) => {
        if (![0, 1, 2, 3].includes(entry.trackIndex as number)) {
          issues.push({
            path: `${entryPath}.trackIndex`,
            message: 'expected a track index from 0 to 3',
          });
        }
        if (entry.direction !== 'forward' && entry.direction !== 'backward') {
          issues.push({ path: `${entryPath}.direction`, message: 'unknown dodge direction' });
        }
        if (!isObject(entry.mode)) {
          issues.push({ path: `${entryPath}.mode`, message: 'expected an object' });
        } else if (entry.mode.kind === 'perfectDodge') {
          requireNonNegativeInteger(
            entry.mode.successDelayFrames,
            `${entryPath}.mode.successDelayFrames`,
            issues,
          );
        } else if (entry.mode.kind !== 'dodge') {
          issues.push({ path: `${entryPath}.mode.kind`, message: 'unknown dodge mode' });
        }
      },
      typeof value.prepFrames === 'number' && Number.isInteger(value.prepFrames)
        ? -Math.max(0, value.prepFrames)
        : 0,
    );
  }
}

export function validateGlobalConfig(
  value: unknown,
  path: string,
  issues: ValidationIssue[],
): void {
  if (!isObject(value)) {
    issues.push({ path, message: 'expected an object' });
    return;
  }
  if (!Array.isArray(value.modifiers)) {
    issues.push({ path: `${path}.modifiers`, message: 'expected an array' });
    return;
  }

  if (value.enabledPresetIds !== undefined) {
    if (!Array.isArray(value.enabledPresetIds))
      issues.push({ path: `${path}.enabledPresetIds`, message: 'expected an array' });
    else {
      const seen = new Set<unknown>();
      value.enabledPresetIds.forEach((id, index) => {
        if (!GLOBAL_CONFIG_PRESETS.some(preset => preset.id === id) || seen.has(id))
          issues.push({
            path: `${path}.enabledPresetIds[${index}]`,
            message: 'unknown or duplicate global preset',
          });
        seen.add(id);
      });
    }
  }
  if (value.customBuffs !== undefined) {
    if (!Array.isArray(value.customBuffs))
      issues.push({ path: `${path}.customBuffs`, message: 'expected an array' });
    else {
      const seen = new Set<string>();
      value.customBuffs.forEach((buff, index) => {
        const buffPath = `${path}.customBuffs[${index}]`;
        if (!isObject(buff)) {
          issues.push({ path: buffPath, message: 'expected an object' });
          return;
        }
        const id = requireString(buff, 'id', buffPath, issues);
        if (id !== null) {
          if (!id.startsWith('scenario:custom-global:') || seen.has(id))
            issues.push({
              path: `${buffPath}.id`,
              message: 'expected a unique scenario:custom-global: id',
            });
          seen.add(id);
        }
        const name = requireString(buff, 'name', buffPath, issues);
        if (name !== null && !name.trim())
          issues.push({ path: `${buffPath}.name`, message: 'name must not be blank' });
        requireBoolean(buff.enabled, `${buffPath}.enabled`, issues);
        if (!isObject(buff.definition))
          issues.push({ path: `${buffPath}.definition`, message: 'expected a Buff definition' });
        else {
          const definitionPath = `${buffPath}.definition`;
          const { actionGraph: graph, ...buffFields } = buff.definition;
          validateBuffDefinition(buffFields, id ?? 'invalid', `${buffPath}.definition`, issues, {
            action: validateActionGraphReference,
            scheduled: validateScheduledSequence,
            graph: (value, path, out) => out.push(...validateActionGraphActions(value, path)),
            contexts: (value, path, entries, out) =>
              validateActionGraphContexts(value, path, entries, out),
          });
          if (!isObject(graph) || !isObject(graph.main) || !isObject(graph.macros)) {
            issues.push({
              path: `${definitionPath}.actionGraph`,
              message: 'custom Buff requires its own main graph and macros',
            });
          } else {
            issues.push(...validateActionGraphActions(graph, `${definitionPath}.actionGraph`));
            try {
              // The topology validator checks untrusted references and reports malformed graphs.
              validateActionGraphOwner(
                buff.definition as unknown as SkillBuffDefinition,
                definitionPath,
              );
            } catch (error) {
              issues.push({
                path: definitionPath,
                message: error instanceof Error ? error.message : String(error),
              });
            }
          }
        }
      });
    }
  }

  const ids = new Set<string>();
  value.modifiers.forEach((modifier, index) => {
    const modifierPath = `${path}.modifiers[${index}]`;
    if (!isObject(modifier)) {
      issues.push({ path: modifierPath, message: 'expected an object' });
      return;
    }
    const id = requireString(modifier, 'id', modifierPath, issues);
    if (id !== null && ids.has(id)) {
      issues.push({ path: `${modifierPath}.id`, message: 'duplicate global modifier id' });
    }
    if (id !== null) ids.add(id);
    if (modifier.kind !== 'operatorStat') {
      issues.push({ path: `${modifierPath}.kind`, message: "expected 'operatorStat'" });
    }
    if (!globalOperatorStatModifiers.has(modifier.modifier as string)) {
      issues.push({ path: `${modifierPath}.modifier`, message: 'unknown operator stat modifier' });
    }
    requireFiniteNumber(modifier.value, `${modifierPath}.value`, issues);
    if (modifier.skillType !== undefined && !skillTypes.has(modifier.skillType as string)) {
      issues.push({ path: `${modifierPath}.skillType`, message: 'unknown skill type' });
    }
    if (modifier.modifier === 'skillCooldownReduction' && modifier.skillType !== 'comboSkill') {
      issues.push({
        path: `${modifierPath}.skillType`,
        message: 'skill cooldown reduction requires comboSkill',
      });
    }
    if (modifier.modifier !== 'skillCooldownReduction' && modifier.skillType !== undefined) {
      issues.push({
        path: `${modifierPath}.skillType`,
        message: 'only skill cooldown reduction accepts a skill type',
      });
    }
    if (
      modifier.modifier === 'skillCooldownReduction' &&
      typeof modifier.value === 'number' &&
      modifier.value >= 1
    ) {
      issues.push({
        path: `${modifierPath}.value`,
        message: 'skill cooldown reduction must be less than 1',
      });
    }
  });
}

export function validateMechanics(value: unknown, path: string, issues: ValidationIssue[]): void {
  if (!isObject(value)) {
    issues.push({ path, message: 'expected an object' });
    return;
  }
  if (!Array.isArray(value.selections)) {
    issues.push({ path: `${path}.selections`, message: 'expected an array' });
    return;
  }

  const ids = new Set<string>();
  value.selections.forEach((selection, index) => {
    const selectionPath = `${path}.selections[${index}]`;
    if (!isObject(selection)) {
      issues.push({ path: selectionPath, message: 'expected an object' });
      return;
    }
    const id = requireString(selection, 'id', selectionPath, issues);
    if (id !== null && ids.has(id)) {
      issues.push({ path: `${selectionPath}.id`, message: 'duplicate mechanic selection id' });
    }
    if (id !== null) ids.add(id);
    requireString(selection, 'mechanicId', selectionPath, issues);
    requireBoolean(selection.enabled, `${selectionPath}.enabled`, issues);

    if (!isObject(selection.parameters)) {
      issues.push({ path: `${selectionPath}.parameters`, message: 'expected an object' });
      return;
    }
    for (const [key, parameter] of Object.entries(selection.parameters)) {
      if (
        typeof parameter !== 'boolean' &&
        typeof parameter !== 'number' &&
        typeof parameter !== 'string'
      ) {
        issues.push({
          path: `${selectionPath}.parameters.${key}`,
          message: 'expected a boolean, finite number, or string',
        });
      } else if (typeof parameter === 'number' && !Number.isFinite(parameter)) {
        issues.push({
          path: `${selectionPath}.parameters.${key}`,
          message: 'expected a boolean, finite number, or string',
        });
      }
    }
  });
}

export function validateEditor(value: unknown, path: string, issues: ValidationIssue[]): void {
  if (!isObject(value)) {
    issues.push({ path, message: 'expected an object' });
    return;
  }
  if (!Array.isArray(value.trackHeightWeights) || value.trackHeightWeights.length !== 4) {
    issues.push({ path: `${path}.trackHeightWeights`, message: 'expected exactly four weights' });
  } else {
    value.trackHeightWeights.forEach((weight, index) =>
      requireFiniteNumber(weight, `${path}.trackHeightWeights[${index}]`, issues),
    );
  }
  requireBoolean(value.prepExpanded, `${path}.prepExpanded`, issues);
  if (value.initialUltimateEnergyPreset !== undefined) {
    const presetPath = `${path}.initialUltimateEnergyPreset`;
    if (!isObject(value.initialUltimateEnergyPreset)) {
      issues.push({ path: presetPath, message: 'expected an object' });
    } else {
      if (!['empty', 'full', 'custom'].includes(String(value.initialUltimateEnergyPreset.mode))) {
        issues.push({ path: `${presetPath}.mode`, message: 'expected empty, full, or custom' });
      }
      validateFiniteNumberRecord(
        value.initialUltimateEnergyPreset.customByTrackId,
        `${presetPath}.customByTrackId`,
        issues,
      );
    }
  }
}
