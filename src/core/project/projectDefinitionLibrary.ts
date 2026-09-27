import type { GameDataBrowser, GameDataRepository } from '../game-data/gameDataRepository';
import type { OperatorDefinition } from '../game-data/operatorDefinition';
import { validateOperatorDefinition } from '../game-data/validateOperatorDefinition';
import type { GlobalEffectDefinition } from '../game-data/globalEffectDefinition';
import { validateGlobalEffectDefinition } from '../game-data/validateGlobalEffectDefinition';
import type { ValidationIssue } from './validationHelpers';
import type {
  GearDefinition,
  GearSetDefinition,
  WeaponDefinition,
} from '../game-data/equipmentDefinition';
import {
  validateGearDefinition,
  validateGearSetDefinition,
  validateWeaponDefinition,
  type EquipmentDefinitionValidationIssue,
} from '../game-data/equipmentDefinitionValidation';
import type {
  EndaxisProjectDocument,
  ProjectDefinitionLibraryDocument,
  ScenarioDocument,
  TrackDocument,
  TrackIndex,
} from './schema';

export const EMPTY_PROJECT_DEFINITION_LIBRARY: ProjectDefinitionLibraryDocument = Object.freeze({
  operators: Object.freeze({}),
  weapons: Object.freeze({}),
  gears: Object.freeze({}),
  gearSets: Object.freeze({}),
});

function assertValidEquipmentDefinition(
  kind: 'weapon' | 'gear' | 'gear set',
  issues: readonly EquipmentDefinitionValidationIssue[],
): void {
  if (issues.length === 0) return;
  const summary = issues.map(issue => `${issue.path}: ${issue.message}`).join('; ');
  throw new Error(`invalid project ${kind} definition: ${summary}`);
}

function assertValidOperatorDefinition(definition: OperatorDefinition, path: string): void {
  const issues = validateOperatorDefinition(definition, path);
  if (issues.length === 0) return;
  throw new Error(
    `invalid project operator definition: ${issues.map(issue => `${issue.path}: ${issue.message}`).join('; ')}`,
  );
}

function assertValidGlobalEffectDefinition(definition: GlobalEffectDefinition, path: string): void {
  const issues: ValidationIssue[] = [];
  validateGlobalEffectDefinition(definition, path, issues);
  if (issues.length === 0) return;
  throw new Error(
    `invalid project global effect definition: ${issues.map(issue => `${issue.path}: ${issue.message}`).join('; ')}`,
  );
}

export function getProjectDefinitionLibrary(
  project: EndaxisProjectDocument,
): ProjectDefinitionLibraryDocument {
  return project.definitionLibrary ?? EMPTY_PROJECT_DEFINITION_LIBRARY;
}

function requireProjectTemplateId(id: string, kind: string): void {
  if (!id.startsWith(`project:${kind}:`) || id.length === `project:${kind}:`.length) {
    throw new Error(`project ${kind} template id '${id}' must use the project:${kind}: namespace`);
  }
}

function clone<T>(value: T): T {
  return structuredClone(value);
}

interface DeriveEquipmentTemplateInput<T> {
  id: string;
  name: string;
  baseTemplateId: string;
  definition: T;
}

export interface DeriveOperatorTemplateInput {
  id: string;
  name: string;
  baseTemplateId: string;
  definition: OperatorDefinition;
}

/** 创建项目干员模板，保持内置定义及其附属图只读。 */
export function deriveProjectOperatorTemplateInLibrary(
  library: ProjectDefinitionLibraryDocument,
  input: DeriveOperatorTemplateInput,
): ProjectDefinitionLibraryDocument {
  requireProjectTemplateId(input.id, 'operator');
  if (!input.name.trim()) throw new Error('project operator template name must not be empty');
  if (library.operators[input.id] !== undefined)
    throw new Error(`project operator template '${input.id}' already exists`);
  if (input.definition.slug !== input.baseTemplateId)
    throw new Error(
      `operator source '${input.definition.slug}' does not match '${input.baseTemplateId}'`,
    );
  assertValidOperatorDefinition(input.definition, '$.source.operator');
  const definition = clone({
    ...input.definition,
    slug: input.id,
    displayName: input.name.trim(),
    assetSlug: input.definition.assetSlug ?? input.definition.slug,
  });
  return {
    ...library,
    operators: {
      ...library.operators,
      [input.id]: {
        id: input.id,
        name: input.name.trim(),
        origin: { templateId: input.baseTemplateId },
        definition,
      },
    },
  };
}

export function deriveProjectOperatorTemplate(
  project: EndaxisProjectDocument,
  input: DeriveOperatorTemplateInput,
): EndaxisProjectDocument {
  return {
    ...project,
    definitionLibrary: deriveProjectOperatorTemplateInLibrary(
      getProjectDefinitionLibrary(project),
      input,
    ),
  };
}

/** 新模板从同一干员派生时保留轨道构筑和已放置技能，只替换定义身份。 */
export function switchTrackToCompatibleOperatorTemplate(
  scenario: ScenarioDocument,
  trackIndex: TrackIndex,
  sourceTemplateId: string,
  nextTemplateId: string,
): ScenarioDocument {
  const track = scenario.tracks[trackIndex];
  if (track?.operator?.operatorSlug !== sourceTemplateId)
    throw new Error(`track ${trackIndex} does not use operator '${sourceTemplateId}'`);
  const tracks = [...scenario.tracks] as ScenarioDocument['tracks'];
  tracks[trackIndex] = {
    ...track,
    operator: { ...track.operator, operatorSlug: nextTemplateId },
  };
  return { ...scenario, tracks };
}

/** 在项目历史边界校验并保存整个干员定义；外部传入对象不会成为可变存档引用。 */
export function replaceProjectOperatorTemplateDefinition(
  project: EndaxisProjectDocument,
  templateId: string,
  definition: OperatorDefinition,
): EndaxisProjectDocument {
  const library = getProjectDefinitionLibrary(project);
  const template = library.operators[templateId];
  if (template === undefined) throw new Error(`missing project operator template '${templateId}'`);
  if (definition.slug !== templateId)
    throw new Error(
      `project operator definition slug '${definition.slug}' does not match template '${templateId}'`,
    );
  assertValidOperatorDefinition(
    definition,
    `$.definitionLibrary.operators['${templateId}'].definition`,
  );
  const nextDefinition = clone(definition);
  return {
    ...project,
    definitionLibrary: {
      ...library,
      operators: {
        ...library.operators,
        [templateId]: {
          ...template,
          name: nextDefinition.displayName?.trim() || template.name,
          definition: nextDefinition,
        },
      },
    },
  };
}

function deriveEquipmentTemplate<T extends { readonly slug: string }>(
  values: Record<
    string,
    {
      id: string;
      name: string;
      origin?: { templateId: string };
      definition: T;
    }
  >,
  kind: 'weapon' | 'gear' | 'gearSet',
  input: DeriveEquipmentTemplateInput<T>,
): typeof values {
  requireProjectTemplateId(input.id, kind);
  if (input.name.trim().length === 0)
    throw new Error(`project ${kind} template name must not be empty`);
  if (values[input.id] !== undefined)
    throw new Error(`project ${kind} template '${input.id}' already exists`);
  const definition = clone({
    ...input.definition,
    slug: input.id,
    displayName: input.name.trim(),
    ...(kind === 'gearSet'
      ? {}
      : {
          assetSlug:
            (input.definition as { assetSlug?: string }).assetSlug ?? input.definition.slug,
        }),
  }) as T;
  return {
    ...values,
    [input.id]: {
      id: input.id,
      name: input.name.trim(),
      origin: { templateId: input.baseTemplateId },
      definition,
    },
  };
}

export function deriveProjectWeaponTemplateInLibrary(
  library: ProjectDefinitionLibraryDocument,
  input: DeriveEquipmentTemplateInput<WeaponDefinition>,
): ProjectDefinitionLibraryDocument {
  assertValidEquipmentDefinition(
    'weapon',
    validateWeaponDefinition(input.definition, `$.source.weapons['${input.baseTemplateId}']`),
  );
  return {
    ...library,
    weapons: deriveEquipmentTemplate(library.weapons, 'weapon', input),
  };
}

export function deriveProjectGearTemplateInLibrary(
  library: ProjectDefinitionLibraryDocument,
  input: DeriveEquipmentTemplateInput<GearDefinition>,
): ProjectDefinitionLibraryDocument {
  assertValidEquipmentDefinition(
    'gear',
    validateGearDefinition(input.definition, `$.source.gears['${input.baseTemplateId}']`),
  );
  return {
    ...library,
    gears: deriveEquipmentTemplate(library.gears, 'gear', input),
  };
}

export function deriveProjectGearSetTemplateInLibrary(
  library: ProjectDefinitionLibraryDocument,
  input: DeriveEquipmentTemplateInput<GearSetDefinition>,
): ProjectDefinitionLibraryDocument {
  assertValidEquipmentDefinition(
    'gear set',
    validateGearSetDefinition(input.definition, `$.source.gearSets['${input.baseTemplateId}']`),
  );
  return {
    ...library,
    gearSets: deriveEquipmentTemplate(library.gearSets, 'gearSet', input),
  };
}

export function deriveProjectWeaponTemplate(
  project: EndaxisProjectDocument,
  input: DeriveEquipmentTemplateInput<WeaponDefinition>,
): EndaxisProjectDocument {
  return {
    ...project,
    definitionLibrary: deriveProjectWeaponTemplateInLibrary(
      getProjectDefinitionLibrary(project),
      input,
    ),
  };
}

export function deriveProjectGearTemplate(
  project: EndaxisProjectDocument,
  input: DeriveEquipmentTemplateInput<GearDefinition>,
): EndaxisProjectDocument {
  return {
    ...project,
    definitionLibrary: deriveProjectGearTemplateInLibrary(
      getProjectDefinitionLibrary(project),
      input,
    ),
  };
}

export function deriveProjectGearSetTemplate(
  project: EndaxisProjectDocument,
  input: DeriveEquipmentTemplateInput<GearSetDefinition>,
): EndaxisProjectDocument {
  return {
    ...project,
    definitionLibrary: deriveProjectGearSetTemplateInLibrary(
      getProjectDefinitionLibrary(project),
      input,
    ),
  };
}

/** A derived weapon keeps the equipped build while changing only its template identity. */
export function switchTrackToCompatibleWeaponTemplate(
  scenario: ScenarioDocument,
  trackIndex: TrackIndex,
  nextTemplateId: string,
  nextDefinition: WeaponDefinition,
): ScenarioDocument {
  const track = scenario.tracks[trackIndex];
  if (track?.weapon === null || track === null)
    throw new Error(`track ${trackIndex} has no weapon`);
  if (track.weapon.traitLevels.length !== nextDefinition.traits.length) {
    throw new Error(
      `weapon template '${nextTemplateId}' cannot preserve ${track.weapon.traitLevels.length} trait levels with ${nextDefinition.traits.length} traits`,
    );
  }
  const tracks = [...scenario.tracks] as ScenarioDocument['tracks'];
  tracks[trackIndex] = {
    ...track,
    weapon: { ...track.weapon, weaponSlug: nextTemplateId },
  };
  return { ...scenario, tracks };
}

/** Replace one materialized weapon definition and keep every referencing build structurally valid. */
export function replaceProjectWeaponTemplateDefinition(
  project: EndaxisProjectDocument,
  templateId: string,
  definition: WeaponDefinition,
): EndaxisProjectDocument {
  const library = getProjectDefinitionLibrary(project);
  const template = library.weapons[templateId];
  if (template === undefined) throw new Error(`missing project weapon template '${templateId}'`);
  if (definition.slug !== templateId) {
    throw new Error(
      `project weapon definition slug '${definition.slug}' does not match template '${templateId}'`,
    );
  }
  // 项目命令是定义进入撤销历史的最后边界，不能只依赖某个 UI 入口预先校验。
  assertValidEquipmentDefinition(
    'weapon',
    validateWeaponDefinition(definition, `$.definitionLibrary.weapons['${templateId}'].definition`),
  );

  const nextDefinition = clone(definition);
  return {
    ...project,
    definitionLibrary: {
      ...library,
      weapons: {
        ...library.weapons,
        [templateId]: {
          ...template,
          name: definition.displayName?.trim() || template.name,
          definition: nextDefinition,
        },
      },
    },
    scenarios: project.scenarios.map(scenario => ({
      ...scenario,
      tracks: scenario.tracks.map(track => {
        if (track?.weapon?.weaponSlug !== templateId) return track;
        return {
          ...track,
          weapon: {
            ...track.weapon,
            traitLevels: nextDefinition.traits.map((trait, index) =>
              Math.min(Math.max(track.weapon?.traitLevels[index] ?? 1, 1), trait.levelCount),
            ),
          },
        };
      }) as ScenarioDocument['tracks'],
    })),
  };
}

/** A derived gear template preserves the selected slot and its artificing state. */
export function switchTrackToCompatibleGearTemplate(
  scenario: ScenarioDocument,
  trackIndex: TrackIndex,
  slot: keyof TrackDocument['gears'],
  nextTemplateId: string,
  nextDefinition: GearDefinition,
): ScenarioDocument {
  const track = scenario.tracks[trackIndex];
  const gear = track?.gears[slot];
  if (track === null || gear == null)
    throw new Error(`track ${trackIndex} slot '${slot}' has no gear`);
  if (gear.artificingLevels.length !== nextDefinition.traits.length) {
    throw new Error(
      `gear template '${nextTemplateId}' cannot preserve ${gear.artificingLevels.length} artificing levels with ${nextDefinition.traits.length} traits`,
    );
  }
  const tracks = [...scenario.tracks] as ScenarioDocument['tracks'];
  tracks[trackIndex] = {
    ...track,
    gears: { ...track.gears, [slot]: { ...gear, gearSlug: nextTemplateId } },
  };
  return { ...scenario, tracks };
}

/** Replace one materialized gear definition and normalize every referencing slot. */
export function replaceProjectGearTemplateDefinition(
  project: EndaxisProjectDocument,
  templateId: string,
  definition: GearDefinition,
): EndaxisProjectDocument {
  const library = getProjectDefinitionLibrary(project);
  const template = library.gears[templateId];
  if (template === undefined) throw new Error(`missing project gear template '${templateId}'`);
  if (definition.slug !== templateId) {
    throw new Error(
      `project gear definition slug '${definition.slug}' does not match template '${templateId}'`,
    );
  }
  assertValidEquipmentDefinition(
    'gear',
    validateGearDefinition(definition, `$.definitionLibrary.gears['${templateId}'].definition`),
  );
  const nextDefinition = clone(definition);
  const slots = ['armor', 'gloves', 'accessory1', 'accessory2'] as const;
  return {
    ...project,
    definitionLibrary: {
      ...library,
      gears: {
        ...library.gears,
        [templateId]: {
          ...template,
          name: definition.displayName?.trim() || template.name,
          definition: nextDefinition,
        },
      },
    },
    scenarios: project.scenarios.map(scenario => ({
      ...scenario,
      tracks: scenario.tracks.map(track => {
        if (track === null) return track;
        let changed = false;
        const gears = { ...track.gears };
        for (const slot of slots) {
          const gear = track.gears[slot];
          if (gear?.gearSlug !== templateId) continue;
          changed = true;
          gears[slot] = {
            ...gear,
            artificingLevels: nextDefinition.traits.map((trait, index) =>
              Math.min(Math.max(gear.artificingLevels[index] ?? 0, 0), trait.levelCount - 1),
            ),
          };
        }
        return changed ? { ...track, gears } : track;
      }) as ScenarioDocument['tracks'],
    })),
  };
}

export function replaceProjectGearSetTemplateDefinition(
  project: EndaxisProjectDocument,
  templateId: string,
  definition: GearSetDefinition,
): EndaxisProjectDocument {
  const library = getProjectDefinitionLibrary(project);
  const template = library.gearSets[templateId];
  if (template === undefined) throw new Error(`missing project gear set template '${templateId}'`);
  if (definition.slug !== templateId) {
    throw new Error(
      `project gear set definition slug '${definition.slug}' does not match template '${templateId}'`,
    );
  }
  assertValidEquipmentDefinition(
    'gear set',
    validateGearSetDefinition(
      definition,
      `$.definitionLibrary.gearSets['${templateId}'].definition`,
    ),
  );
  return {
    ...project,
    definitionLibrary: {
      ...library,
      gearSets: {
        ...library.gearSets,
        [templateId]: {
          ...template,
          name: definition.displayName?.trim() || template.name,
          definition: clone(definition),
        },
      },
    },
  };
}

export interface DeriveGlobalEffectTemplateInput {
  id: string;
  name: string;
  baseTemplateId: string;
  definition: GlobalEffectDefinition;
}

/** 创建项目全局效果资产，保持内置定义及其附属图只读。 */
export function deriveProjectGlobalEffectTemplateInLibrary(
  library: ProjectDefinitionLibraryDocument,
  input: DeriveGlobalEffectTemplateInput,
): ProjectDefinitionLibraryDocument {
  requireProjectTemplateId(input.id, 'globalEffect');
  if (!input.name.trim()) throw new Error('project global effect template name must not be empty');
  if (library.globalEffects?.[input.id] !== undefined)
    throw new Error(`project global effect template '${input.id}' already exists`);
  if (input.definition.id !== input.baseTemplateId)
    throw new Error(
      `global effect source '${input.definition.id}' does not match '${input.baseTemplateId}'`,
    );
  assertValidGlobalEffectDefinition(input.definition, '$.source.globalEffect');
  const definition = clone({ ...input.definition, id: input.id });
  return {
    ...library,
    globalEffects: {
      ...library.globalEffects,
      [input.id]: {
        id: input.id,
        name: input.name.trim(),
        origin: { templateId: input.baseTemplateId },
        definition,
      },
    },
  };
}

export function deriveProjectGlobalEffectTemplate(
  project: EndaxisProjectDocument,
  input: DeriveGlobalEffectTemplateInput,
): EndaxisProjectDocument {
  return {
    ...project,
    definitionLibrary: deriveProjectGlobalEffectTemplateInLibrary(
      getProjectDefinitionLibrary(project),
      input,
    ),
  };
}

/** 在项目历史边界校验并保存整个全局效果定义；外部传入对象不会成为可变存档引用。 */
export function replaceProjectGlobalEffectTemplateDefinition(
  project: EndaxisProjectDocument,
  templateId: string,
  definition: GlobalEffectDefinition,
  name?: string,
): EndaxisProjectDocument {
  const library = getProjectDefinitionLibrary(project);
  const template = library.globalEffects?.[templateId];
  if (template === undefined)
    throw new Error(`missing project global effect template '${templateId}'`);
  if (definition.id !== templateId)
    throw new Error(
      `project global effect definition id '${definition.id}' does not match template '${templateId}'`,
    );
  assertValidGlobalEffectDefinition(
    definition,
    `$.definitionLibrary.globalEffects['${templateId}'].definition`,
  );
  return {
    ...project,
    definitionLibrary: {
      ...library,
      globalEffects: {
        ...library.globalEffects,
        [templateId]: {
          ...template,
          name: name?.trim() || template.name,
          definition: clone(definition),
        },
      },
    },
  };
}

export type ProjectGameData = GameDataRepository & GameDataBrowser;

export function createProjectGameDataIndex(
  base: GameDataRepository,
  library: ProjectDefinitionLibraryDocument,
): GameDataRepository {
  const operators = new Map(
    Object.values(library.operators).map(value => [value.definition.slug, value.definition]),
  );
  const weapons = new Map(
    Object.values(library.weapons).map(value => [value.definition.slug, value.definition]),
  );
  const gears = new Map(
    Object.values(library.gears).map(value => [value.definition.slug, value.definition]),
  );
  const gearSets = new Map(
    Object.values(library.gearSets).map(value => [value.definition.slug, value.definition]),
  );
  const globalEffects = new Map(
    Object.values(library.globalEffects ?? {}).map(value => [
      value.definition.id,
      value.definition,
    ]),
  );
  for (const [id] of operators) {
    if (base.getOperator(id) !== null)
      throw new Error(`project operator template '${id}' conflicts with built-in data`);
  }
  for (const [id] of weapons) {
    if (base.getWeapon(id) !== null)
      throw new Error(`project weapon template '${id}' conflicts with built-in data`);
  }
  for (const [id] of gears) {
    if (base.getGear(id) !== null)
      throw new Error(`project gear template '${id}' conflicts with built-in data`);
  }
  for (const [id] of gearSets) {
    if (base.getGearSet(id) !== null)
      throw new Error(`project gear set template '${id}' conflicts with built-in data`);
  }
  for (const [id] of globalEffects) {
    if (base.getGlobalEffect(id) !== null)
      throw new Error(`project global effect template '${id}' conflicts with built-in data`);
  }
  return {
    ...base,
    getOperator: id => operators.get(id) ?? base.getOperator(id),
    getWeapon: id => weapons.get(id) ?? base.getWeapon(id),
    getGear: id => gears.get(id) ?? base.getGear(id),
    getGearSet: id => gearSets.get(id) ?? base.getGearSet(id),
    getGlobalEffect: id => globalEffects.get(id) ?? base.getGlobalEffect(id),
  };
}

/** 把项目模板与只读版本化仓库合成为选择器、编译器和模拟共用的查询视图。 */
export function createProjectGameDataRepository(
  base: ProjectGameData,
  library: ProjectDefinitionLibraryDocument,
): ProjectGameData {
  const operators = Object.values(library.operators).map(value => value.definition);
  const weapons = Object.values(library.weapons).map(value => value.definition);
  const gears = Object.values(library.gears).map(value => value.definition);
  const gearSets = Object.values(library.gearSets).map(value => value.definition);
  const globalEffects = Object.values(library.globalEffects ?? {}).map(value => value.definition);

  const index = createProjectGameDataIndex(base, library);
  return {
    ...index,
    getOperators: () => [...base.getOperators(), ...operators],
    getWeapons: () => [...base.getWeapons(), ...weapons],
    getGears: () => [...base.getGears(), ...gears],
    getGearSets: () => [...base.getGearSets(), ...gearSets],
    getEnemies: () => base.getEnemies(),
    getGlobalEffects: () => [...base.getGlobalEffects(), ...globalEffects],
  };
}
