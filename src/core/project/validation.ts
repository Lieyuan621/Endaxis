import { validateActionGraphReferenceDefinition } from '../game-data/validation/actionPrograms';
/**
 * 不可信 JSON 进入新版项目模型的顶层校验边界。
 * 加载、导入和迁移结果都必须先通过这里，业务代码不能直接断言外部对象是存档。
 */
import {
  PROJECT_FPS,
  PROJECT_KIND,
  PROJECT_SCHEMA_VERSION,
  type EndaxisProjectDocument,
} from './schema';
import {
  COMBO_SKILL_PRIORITIES,
  DAMAGE_ELEMENTS,
  PLAYER_SKILL_INPUTS,
} from '../game-data/operatorDefinition';
import {
  validateGearDefinition,
  validateGearSetDefinition,
  validateWeaponDefinition,
} from '../game-data/equipmentDefinitionValidation';
import {
  validateBattle,
  validateEditor,
  validateEnemy,
  validateGearInstance,
  validateGlobalConfig,
  validateMechanics,
  validateOperatorInstance,
  validateWeaponInstance,
} from './scenarioValidation';
import { validateSkillDefinition } from '../game-data/validateSkillDefinition';
import { validateActionGraphOwner } from '../action-graph/actionGraphValidation';
import type {
  ActionGraphDefinition,
  ActionGraphResourceDefinition,
} from '../../../packages/game-data-contract/src/actionGraph';
import { validateComboSkillConditions } from '../game-data/validateComboSkillConditions';
import {
  isObject,
  requireBoolean,
  requireEnum,
  requireFiniteNumber,
  requireInteger,
  requireString,
  type ValidationIssue,
} from './validationHelpers';

export type { ValidationIssue } from './validationHelpers';

const damageElements = new Set<string>(DAMAGE_ELEMENTS);
const playerSkillInputs = new Set<string>(PLAYER_SKILL_INPUTS);

function validateProjectTemplateRecord(
  value: unknown,
  path: string,
  kind: 'operator' | 'weapon' | 'gear' | 'gearSet',
  issues: ValidationIssue[],
): void {
  if (!isObject(value)) {
    issues.push({ path, message: 'expected an object' });
    return;
  }
  for (const [id, template] of Object.entries(value)) {
    const templatePath = `${path}.${JSON.stringify(id)}`;
    if (!id.startsWith(`project:${kind}:`) || id.length === `project:${kind}:`.length) {
      issues.push({ path: templatePath, message: `expected project:${kind}: template id` });
    }
    if (!isObject(template)) {
      issues.push({ path: templatePath, message: 'expected an object' });
      continue;
    }
    const declaredId = requireString(template, 'id', templatePath, issues);
    if (declaredId !== null && declaredId !== id) {
      issues.push({ path: `${templatePath}.id`, message: 'template id must match record key' });
    }
    requireString(template, 'name', templatePath, issues);
    if (template.origin !== undefined) {
      if (!isObject(template.origin)) {
        issues.push({ path: `${templatePath}.origin`, message: 'expected an object' });
      } else {
        requireString(template.origin, 'templateId', `${templatePath}.origin`, issues);
      }
    }
    if (!isObject(template.definition)) {
      issues.push({ path: `${templatePath}.definition`, message: 'expected an object' });
      continue;
    }
    if (template.definition.slug !== id) {
      issues.push({
        path: `${templatePath}.definition.slug`,
        message: 'definition identity mismatch',
      });
    }
    const definitionPath = `${templatePath}.definition`;
    if (kind === 'operator') {
      try {
        validateActionGraphOwner(
          template.definition as {
            actionGraph?: ActionGraphDefinition | ActionGraphResourceDefinition;
          },
          definitionPath,
        );
      } catch (error) {
        issues.push({
          path: definitionPath,
          message: error instanceof Error ? error.message : String(error),
        });
      }

      issues.push(
        ...validateComboSkillConditions(
          template.definition.comboSkillConditions,
          `${definitionPath}.comboSkillConditions`,
          validateActionGraphReferenceDefinition,
        ),
      );
      if (
        template.definition.comboSkillPriority !== undefined &&
        !(COMBO_SKILL_PRIORITIES as readonly string[]).includes(
          String(template.definition.comboSkillPriority),
        )
      ) {
        issues.push({
          path: `${definitionPath}.comboSkillPriority`,
          message: 'expected a native combo priority',
        });
      }
      requireString(template.definition, 'gameId', definitionPath, issues);
      if (!Array.isArray(template.definition.skillGroups)) {
        issues.push({ path: `${definitionPath}.skillGroups`, message: 'expected an array' });
      } else {
        template.definition.skillGroups.forEach((group, groupIndex) => {
          const groupPath = `${definitionPath}.skillGroups[${groupIndex}]`;
          if (!isObject(group)) {
            issues.push({ path: groupPath, message: 'expected an object' });
            return;
          }
          requireString(group, 'key', groupPath, issues);
          const skills = Array.isArray(group.skills) ? group.skills : [group.skills];
          skills.forEach((skill, skillIndex) => {
            issues.push(...validateSkillDefinition(skill, `${groupPath}.skills[${skillIndex}]`));
          });
          if (Array.isArray(group.variants)) {
            group.variants.forEach((variant, variantIndex) => {
              if (!isObject(variant)) {
                issues.push({
                  path: `${groupPath}.variants[${variantIndex}]`,
                  message: 'expected an object',
                });
                return;
              }
              const variantPath = `${groupPath}.variants[${variantIndex}]`;
              requireString(variant, 'key', variantPath, issues);
              requireString(variant, 'levelSource', variantPath, issues);
              const variantSkills = Array.isArray(variant.skills)
                ? variant.skills
                : [variant.skills];
              variantSkills.forEach((skill, skillIndex) => {
                issues.push(
                  ...validateSkillDefinition(skill, `${variantPath}.skills[${skillIndex}]`),
                );
              });
            });
          }
        });
      }
    } else {
      const definitionIssues =
        kind === 'weapon'
          ? validateWeaponDefinition(template.definition, definitionPath)
          : kind === 'gear'
            ? validateGearDefinition(template.definition, definitionPath)
            : validateGearSetDefinition(template.definition, definitionPath);
      issues.push(...definitionIssues);
    }
  }
}

function validateProjectDefinitionLibrary(
  value: unknown,
  path: string,
  issues: ValidationIssue[],
): void {
  if (!isObject(value)) {
    issues.push({ path, message: 'expected an object' });
    return;
  }
  validateProjectTemplateRecord(value.operators, `${path}.operators`, 'operator', issues);
  validateProjectTemplateRecord(value.weapons, `${path}.weapons`, 'weapon', issues);
  validateProjectTemplateRecord(value.gears, `${path}.gears`, 'gear', issues);
  validateProjectTemplateRecord(value.gearSets, `${path}.gearSets`, 'gearSet', issues);
}

/** 严格校验后的项目或完整问题列表；失败值不得进入领域层。 */
export type ValidationResult =
  { ok: true; value: EndaxisProjectDocument } | { ok: false; issues: ValidationIssue[] };

function validateSkillCast(
  value: unknown,
  path: string,
  skillCastIds: Set<string>,
  issues: ValidationIssue[],
): void {
  if (!isObject(value)) {
    issues.push({ path, message: 'expected an object' });
    return;
  }

  const id = requireString(value, 'id', path, issues);
  if (id !== null) {
    if (skillCastIds.has(id)) {
      issues.push({ path: `${path}.id`, message: 'duplicate skill cast id' });
    }
    skillCastIds.add(id);
  }

  if (!isObject(value.source)) {
    issues.push({ path: `${path}.source`, message: 'expected an object' });
  } else {
    const sourcePath = `${path}.source`;
    const sourceKind = requireString(value.source, 'kind', sourcePath, issues);
    if (sourceKind === 'operatorSkill') {
      requireString(value.source, 'skillGroupKey', sourcePath, issues);
      requireString(value.source, 'skillKey', sourcePath, issues);
      if (value.source.action !== undefined) {
        requireEnum(value.source.action, playerSkillInputs, `${sourcePath}.action`, issues);
      }
    } else if (sourceKind === 'custom') {
      requireString(value.source, 'actionType', sourcePath, issues);
      requireString(value.source, 'name', sourcePath, issues);
      if (value.source.element !== undefined) {
        requireEnum(value.source.element, damageElements, `${sourcePath}.element`, issues);
      }
      if (value.source.iconKey !== undefined) {
        requireString(value.source, 'iconKey', sourcePath, issues);
      }
    } else if (sourceKind !== null) {
      issues.push({ path: `${sourcePath}.kind`, message: 'unknown skill cast source kind' });
    }
  }

  if (!isObject(value.placement)) {
    issues.push({ path: `${path}.placement`, message: 'expected an object' });
  } else if (value.placement.afterCastId !== undefined) {
    requireString(value.placement, 'afterCastId', `${path}.placement`, issues);
    if (value.placement.startFrame !== undefined) {
      issues.push({
        path: `${path}.placement`,
        message: 'startFrame and afterCastId are mutually exclusive',
      });
    }
  } else {
    requireInteger(value.placement.startFrame, `${path}.placement.startFrame`, issues);
  }

  if (value.presentation !== undefined) {
    if (!isObject(value.presentation)) {
      issues.push({ path: `${path}.presentation`, message: 'expected an object' });
    } else {
      if (value.presentation.locked !== undefined) {
        requireBoolean(value.presentation.locked, `${path}.presentation.locked`, issues);
      }
      if (value.presentation.disabled !== undefined) {
        requireBoolean(value.presentation.disabled, `${path}.presentation.disabled`, issues);
      }
      if (
        value.presentation.color !== undefined &&
        value.presentation.color !== null &&
        typeof value.presentation.color !== 'string'
      ) {
        issues.push({ path: `${path}.presentation.color`, message: 'expected a string or null' });
      }
      if ('customBars' in value.presentation) {
        issues.push({
          path: `${path}.presentation.customBars`,
          message: 'custom time bars are no longer supported',
        });
      }
    }
  }

  if (value.simulationInputs !== undefined) {
    const inputPath = `${path}.simulationInputs`;
    if (!isObject(value.simulationInputs)) {
      issues.push({ path: inputPath, message: 'expected an object' });
    } else {
      if ('cameraToTargetSignedAngleDegrees' in value.simulationInputs) {
        issues.push({
          path: `${inputPath}.cameraToTargetSignedAngleDegrees`,
          message: 'camera-to-target angle input is no longer supported',
        });
      }
      if (value.simulationInputs.randomSeed !== undefined) {
        const seed = value.simulationInputs.randomSeed;
        if (typeof seed !== 'number' || !Number.isInteger(seed) || seed < 0 || seed > 0xffffffff) {
          issues.push({
            path: `${inputPath}.randomSeed`,
            message: 'expected a 32-bit unsigned integer',
          });
        }
      }
      if (value.simulationInputs.criticalOverrides !== undefined) {
        const overrides = value.simulationInputs.criticalOverrides;
        if (
          !isObject(overrides) ||
          Object.entries(overrides).some(
            ([key, result]) => key.length === 0 || typeof result !== 'boolean',
          )
        ) {
          issues.push({
            path: `${inputPath}.criticalOverrides`,
            message: 'expected non-empty step keys with boolean results',
          });
        }
      }
    }
  }

  if (value.customDefinition !== undefined) {
    const defPath = `${path}.customDefinition`;
    if (!isObject(value.customDefinition)) {
      issues.push({ path: defPath, message: 'expected an object' });
    } else {
      const def = value.customDefinition as Record<string, unknown>;
      if (isObject(value.source) && value.source.kind === 'operatorSkill') {
        const castSkillKey = (value.source as Record<string, unknown>).skillKey;
        if (typeof castSkillKey === 'string' && def.key !== castSkillKey) {
          issues.push({
            path: `${defPath}.key`,
            message: `custom definition key must match cast skill key '${castSkillKey}'`,
          });
        }
      }
      const isGraphDefinition =
        isObject(def.actionGraph) &&
        isObject(def.actionGraph.main) &&
        isObject(def.actionGraph.macros);
      if (!isGraphDefinition) {
        issues.push({
          path: `${defPath}.actionGraph`,
          message: 'custom skill requires its own action graph',
        });
      }
      const sdIssues = validateSkillDefinition(value.customDefinition, defPath);
      for (const sd of sdIssues) issues.push(sd);
      if (isGraphDefinition) {
        try {
          validateActionGraphOwner(
            def as { actionGraph: ActionGraphDefinition | ActionGraphResourceDefinition },
            defPath,
          );
        } catch (error) {
          issues.push({
            path: defPath,
            message: error instanceof Error ? error.message : String(error),
          });
        }
      }
    }
  }
}

/** 顺序链只允许同轨的一对一前后关系；结构校验不依赖技能时长或模拟是否成功。 */
function validateTrackSkillCastPlacements(
  casts: readonly unknown[],
  path: string,
  issues: ValidationIssue[],
): void {
  const entries = new Map<string, { previous?: string; path: string }>();
  casts.forEach((cast, index) => {
    if (!isObject(cast) || typeof cast.id !== 'string' || !isObject(cast.placement)) return;
    entries.set(cast.id, {
      ...(typeof cast.placement.afterCastId === 'string'
        ? { previous: cast.placement.afterCastId }
        : {}),
      path: `${path}[${index}].placement.afterCastId`,
    });
  });
  const successors = new Set<string>();
  for (const entry of entries.values()) {
    if (entry.previous === undefined) continue;
    if (!entries.has(entry.previous))
      issues.push({ path: entry.path, message: 'predecessor must exist on the same track' });
    if (successors.has(entry.previous))
      issues.push({ path: entry.path, message: 'predecessor already has a successor' });
    successors.add(entry.previous);
  }
  const checked = new Set<string>();
  for (const id of entries.keys()) {
    const visiting = new Set<string>();
    let current: string | undefined = id;
    while (current !== undefined && entries.has(current) && !checked.has(current)) {
      if (visiting.has(current)) {
        issues.push({ path: entries.get(current)!.path, message: 'skill cast placement cycle' });
        break;
      }
      visiting.add(current);
      current = entries.get(current)!.previous;
    }
    visiting.forEach(value => checked.add(value));
  }
}

function validateEndpoint(
  value: unknown,
  path: string,
  skillCastIds: Set<string>,
  issues: ValidationIssue[],
): void {
  if (!isObject(value)) {
    issues.push({ path, message: 'expected an object' });
    return;
  }
  const skillCastId = requireString(value, 'skillCastId', path, issues);
  if (skillCastId !== null && !skillCastIds.has(skillCastId)) {
    issues.push({ path: `${path}.skillCastId`, message: 'unknown skill cast reference' });
  }
  if (value.kind !== 'skillCast') {
    issues.push({ path: `${path}.kind`, message: "expected 'skillCast'" });
  }
}

export function validateProjectDocument(value: unknown): ValidationResult {
  const issues: ValidationIssue[] = [];
  if (!isObject(value)) {
    return { ok: false, issues: [{ path: '$', message: 'expected an object' }] };
  }

  if (value.kind !== PROJECT_KIND) {
    issues.push({ path: '$.kind', message: `expected '${PROJECT_KIND}'` });
  }
  if (value.schemaVersion !== PROJECT_SCHEMA_VERSION) {
    issues.push({
      path: '$.schemaVersion',
      message: `expected schema version ${PROJECT_SCHEMA_VERSION}`,
    });
  }
  if (value.fps !== PROJECT_FPS) issues.push({ path: '$.fps', message: `expected ${PROJECT_FPS}` });

  const activeScenarioId = requireString(value, 'activeScenarioId', '$', issues);
  requireString(value, 'createdWith', '$', issues);
  const createdAt = requireString(value, 'createdAt', '$', issues);
  if (
    createdAt !== null &&
    (Number.isNaN(Date.parse(createdAt)) || new Date(createdAt).toISOString() !== createdAt)
  )
    issues.push({ path: '$.createdAt', message: 'expected an ISO 8601 UTC timestamp' });
  if (value.definitionLibrary !== undefined) {
    validateProjectDefinitionLibrary(value.definitionLibrary, '$.definitionLibrary', issues);
  }

  if (!Array.isArray(value.scenarios) || value.scenarios.length === 0) {
    issues.push({ path: '$.scenarios', message: 'expected at least one scenario' });
  } else {
    const scenarioIds = new Set<string>();
    value.scenarios.forEach((scenario, scenarioIndex) => {
      const path = `$.scenarios[${scenarioIndex}]`;
      if (!isObject(scenario)) {
        issues.push({ path, message: 'expected an object' });
        return;
      }
      const scenarioId = requireString(scenario, 'id', path, issues);
      requireString(scenario, 'name', path, issues);
      if (scenarioId !== null) {
        if (scenarioIds.has(scenarioId))
          issues.push({ path: `${path}.id`, message: 'duplicate scenario id' });
        scenarioIds.add(scenarioId);
      }
      if (scenario.inheritance !== undefined) {
        if (!isObject(scenario.inheritance)) {
          issues.push({ path: `${path}.inheritance`, message: 'expected an object' });
        } else {
          requireString(scenario.inheritance, 'sourceScenarioId', `${path}.inheritance`, issues);
          requireInteger(scenario.inheritance.frame, `${path}.inheritance.frame`, issues);
        }
      }

      if (!Array.isArray(scenario.tracks) || scenario.tracks.length !== 4) {
        issues.push({ path: `${path}.tracks`, message: 'expected exactly four track slots' });
        return;
      }

      const skillCastIds = new Set<string>();
      const consumableUseIds = new Set<string>();
      const trackIds = new Set<string>();
      scenario.tracks.forEach((track, trackIndex) => {
        if (track === null) return;
        const trackPath = `${path}.tracks[${trackIndex}]`;
        if (!isObject(track)) {
          issues.push({ path: trackPath, message: 'expected an object or null' });
          return;
        }
        const trackId = requireString(track, 'id', trackPath, issues);
        if (trackId !== null) {
          if (trackIds.has(trackId)) {
            issues.push({ path: `${trackPath}.id`, message: 'duplicate track identity' });
          }
          trackIds.add(trackId);
        }
        if (track.operator !== null && track.operator !== undefined) {
          const instancePath = `${trackPath}.operator`;
          if (!isObject(track.operator)) {
            issues.push({ path: instancePath, message: 'expected an object or null' });
          } else {
            validateOperatorInstance(track.operator, instancePath, issues);
          }
        } else if (!('operator' in track)) {
          issues.push({ path: `${trackPath}.operator`, message: 'missing operator instance' });
        }
        if (track.weapon !== null && track.weapon !== undefined) {
          if (!isObject(track.weapon)) {
            issues.push({ path: `${trackPath}.weapon`, message: 'expected an object or null' });
          } else {
            validateWeaponInstance(track.weapon, `${trackPath}.weapon`, issues);
          }
        } else if (!('weapon' in track)) {
          issues.push({ path: `${trackPath}.weapon`, message: 'missing weapon instance' });
        }
        if (track.gears !== null && track.gears !== undefined && isObject(track.gears)) {
          for (const slot of ['armor', 'gloves', 'accessory1', 'accessory2']) {
            if (!(slot in track.gears)) {
              issues.push({ path: `${trackPath}.gears.${slot}`, message: 'missing gear slot' });
              continue;
            }
            const gearInstance = track.gears[slot as keyof typeof track.gears];
            if (gearInstance !== null && gearInstance !== undefined) {
              if (!isObject(gearInstance)) {
                issues.push({
                  path: `${trackPath}.gears.${slot}`,
                  message: 'expected an object or null',
                });
              } else {
                validateGearInstance(gearInstance, `${trackPath}.gears.${slot}`, issues);
              }
            }
          }
        } else {
          issues.push({ path: `${trackPath}.gears`, message: 'expected an object' });
        }
        if (!isObject(track.initialState)) {
          issues.push({ path: `${trackPath}.initialState`, message: 'expected an object' });
        } else {
          requireFiniteNumber(
            track.initialState.ultimateEnergy,
            `${trackPath}.initialState.ultimateEnergy`,
            issues,
          );
          if (track.initialState.maxUltimateEnergyOverride !== undefined) {
            requireFiniteNumber(
              track.initialState.maxUltimateEnergyOverride,
              `${trackPath}.initialState.maxUltimateEnergyOverride`,
              issues,
            );
          }
        }
        if (!Array.isArray(track.skillCasts)) {
          issues.push({ path: `${trackPath}.skillCasts`, message: 'expected an array' });
          return;
        }
        track.skillCasts.forEach((skillCast, skillCastIndex) =>
          validateSkillCast(
            skillCast,
            `${trackPath}.skillCasts[${skillCastIndex}]`,
            skillCastIds,
            issues,
          ),
        );
        validateTrackSkillCastPlacements(track.skillCasts, `${trackPath}.skillCasts`, issues);
        if (track.consumableUses !== undefined) {
          if (!Array.isArray(track.consumableUses)) {
            issues.push({ path: `${trackPath}.consumableUses`, message: 'expected an array' });
          } else {
            track.consumableUses.forEach((use, useIndex) => {
              const usePath = `${trackPath}.consumableUses[${useIndex}]`;
              if (!isObject(use)) {
                issues.push({ path: usePath, message: 'expected an object' });
                return;
              }
              const useId = requireString(use, 'id', usePath, issues);
              if (useId !== null && consumableUseIds.has(useId)) {
                issues.push({ path: `${usePath}.id`, message: 'duplicate consumable use id' });
              }
              if (useId !== null) consumableUseIds.add(useId);
              requireInteger(use.frame, `${usePath}.frame`, issues);
              requireString(use, 'consumableId', usePath, issues);
            });
          }
        }
      });

      if (!Array.isArray(scenario.connections)) {
        issues.push({ path: `${path}.connections`, message: 'expected an array' });
      } else {
        const connectionIds = new Set<string>();
        scenario.connections.forEach((connection, connectionIndex) => {
          const connectionPath = `${path}.connections[${connectionIndex}]`;
          if (!isObject(connection)) {
            issues.push({ path: connectionPath, message: 'expected an object' });
            return;
          }
          const connectionId = requireString(connection, 'id', connectionPath, issues);
          if (connectionId !== null && connectionIds.has(connectionId)) {
            issues.push({ path: `${connectionPath}.id`, message: 'duplicate connection id' });
          }
          if (connectionId !== null) connectionIds.add(connectionId);
          requireBoolean(connection.consumption, `${connectionPath}.consumption`, issues);
          validateEndpoint(connection.from, `${connectionPath}.from`, skillCastIds, issues);
          validateEndpoint(connection.to, `${connectionPath}.to`, skillCastIds, issues);
        });
      }

      validateEnemy(scenario.enemy, `${path}.enemy`, issues);
      validateBattle(scenario.battle, `${path}.battle`, issues);
      const prepFrames =
        isObject(scenario.battle) &&
        typeof scenario.battle.prepFrames === 'number' &&
        Number.isInteger(scenario.battle.prepFrames) &&
        scenario.battle.prepFrames >= 0
          ? scenario.battle.prepFrames
          : null;
      if (prepFrames !== null) {
        scenario.tracks.forEach((track, trackIndex) => {
          if (!isObject(track) || !Array.isArray(track.skillCasts)) return;
          track.skillCasts.forEach((cast, castIndex) => {
            if (!isObject(cast) || !isObject(cast.placement)) return;
            const startFrame = cast.placement.startFrame;
            if (typeof startFrame === 'number' && startFrame < -prepFrames) {
              issues.push({
                path: `${path}.tracks[${trackIndex}].skillCasts[${castIndex}].placement.startFrame`,
                message: 'must not precede the preparation range',
              });
            }
          });
          if (Array.isArray(track.consumableUses)) {
            track.consumableUses.forEach((use, useIndex) => {
              if (!isObject(use)) return;
              if (typeof use.frame === 'number' && use.frame < -prepFrames) {
                issues.push({
                  path: `${path}.tracks[${trackIndex}].consumableUses[${useIndex}].frame`,
                  message: 'must not precede the preparation range',
                });
              }
            });
          }
        });
      }
      validateMechanics(scenario.mechanics, `${path}.mechanics`, issues);
      validateGlobalConfig(scenario.globalConfig, `${path}.globalConfig`, issues);
      validateEditor(scenario.editor, `${path}.editor`, issues);
    });

    if (activeScenarioId !== null && !scenarioIds.has(activeScenarioId)) {
      issues.push({ path: '$.activeScenarioId', message: 'unknown active scenario' });
    }
  }

  if (issues.length > 0) return { ok: false, issues };
  return { ok: true, value: value as unknown as EndaxisProjectDocument };
}
