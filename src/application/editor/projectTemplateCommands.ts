import type { OperatorDefinition } from '../../../packages/game-data-contract/src/operators.ts';
import type {
  GearDefinition,
  GearSetDefinition,
  WeaponDefinition,
} from '../../../packages/game-data-contract/src/equipment.ts';
import {
  deriveProjectOperatorTemplate,
  deriveProjectWeaponTemplate,
  deriveProjectGearTemplate,
  deriveProjectGearSetTemplate,
  deriveProjectGlobalEffectTemplate,
  replaceProjectOperatorTemplateDefinition,
  replaceProjectWeaponTemplateDefinition,
  replaceProjectGearTemplateDefinition,
  replaceProjectGearSetTemplateDefinition,
  replaceProjectGlobalEffectTemplateDefinition,
} from '../../core/project/projectDefinitionLibrary.ts';
import type { GlobalEffectDefinition } from '../../core/game-data/globalEffectDefinition.ts';
import type { EndaxisProjectDocument } from '../../core/project/schema.ts';
import { getProjectDefinitionLibrary } from '../../core/project/projectDefinitionLibrary.ts';
import {
  readGraphPresentation,
  type SkillGraphPresentation,
} from '../../core/project/graphPresentation.ts';

export type ProjectTemplateKind = 'operator' | 'weapon' | 'gear' | 'gearSet' | 'globalEffect';
export type ProjectTemplateDefinition =
  | OperatorDefinition
  | WeaponDefinition
  | GearDefinition
  | GearSetDefinition
  | GlobalEffectDefinition;

export type ProjectTemplateEdit =
  | { readonly kind: 'operator'; readonly definition: OperatorDefinition }
  | { readonly kind: 'weapon'; readonly definition: WeaponDefinition }
  | { readonly kind: 'gear'; readonly definition: GearDefinition }
  | { readonly kind: 'gearSet'; readonly definition: GearSetDefinition }
  | { readonly kind: 'globalEffect'; readonly definition: GlobalEffectDefinition };

/** 各类项目资产共用一个提交入口；具体领域校验仍由各自的项目命令负责。 */
export function saveProjectTemplateDefinition(
  project: EndaxisProjectDocument,
  edit: ProjectTemplateEdit,
  sourceId: string,
  targetId: string,
  name: string,
  replace: boolean,
  graphPresentations: Readonly<Record<string, SkillGraphPresentation>>,
): EndaxisProjectDocument {
  let saved: EndaxisProjectDocument;
  if (replace) {
    switch (edit.kind) {
      case 'operator':
        saved = replaceProjectOperatorTemplateDefinition(project, targetId, {
          ...edit.definition,
          slug: targetId,
          displayName: name.trim(),
        });
        break;
      case 'weapon':
        saved = replaceProjectWeaponTemplateDefinition(project, targetId, {
          ...edit.definition,
          slug: targetId,
          displayName: name.trim(),
        });
        break;
      case 'gear':
        saved = replaceProjectGearTemplateDefinition(project, targetId, {
          ...edit.definition,
          slug: targetId,
          displayName: name.trim(),
        });
        break;
      case 'gearSet':
        saved = replaceProjectGearSetTemplateDefinition(project, targetId, {
          ...edit.definition,
          slug: targetId,
          displayName: name.trim(),
        });
        break;
      case 'globalEffect':
        saved = replaceProjectGlobalEffectTemplateDefinition(
          project,
          targetId,
          { ...edit.definition, id: targetId },
          name,
        );
        break;
    }
  } else {
    const identity = { id: targetId, name, baseTemplateId: sourceId };
    switch (edit.kind) {
      case 'operator':
        saved = deriveProjectOperatorTemplate(project, {
          ...identity,
          definition: edit.definition,
        });
        break;
      case 'weapon':
        saved = deriveProjectWeaponTemplate(project, { ...identity, definition: edit.definition });
        break;
      case 'gear':
        saved = deriveProjectGearTemplate(project, { ...identity, definition: edit.definition });
        break;
      case 'gearSet':
        saved = deriveProjectGearSetTemplate(project, { ...identity, definition: edit.definition });
        break;
      case 'globalEffect':
        saved = deriveProjectGlobalEffectTemplate(project, {
          ...identity,
          definition: edit.definition,
        });
        break;
    }
  }
  const library = getProjectDefinitionLibrary(saved);
  const presentation = Object.fromEntries(
    Object.entries(graphPresentations).map(([key, value]) => [key, readGraphPresentation(value)]),
  );
  switch (edit.kind) {
    case 'operator':
      return {
        ...saved,
        definitionLibrary: {
          ...library,
          operators: {
            ...library.operators,
            [targetId]: { ...library.operators[targetId]!, graphPresentations: presentation },
          },
        },
      };
    case 'weapon':
      return {
        ...saved,
        definitionLibrary: {
          ...library,
          weapons: {
            ...library.weapons,
            [targetId]: { ...library.weapons[targetId]!, graphPresentations: presentation },
          },
        },
      };
    case 'gear':
      return {
        ...saved,
        definitionLibrary: {
          ...library,
          gears: {
            ...library.gears,
            [targetId]: { ...library.gears[targetId]!, graphPresentations: presentation },
          },
        },
      };
    case 'gearSet':
      return {
        ...saved,
        definitionLibrary: {
          ...library,
          gearSets: {
            ...library.gearSets,
            [targetId]: { ...library.gearSets[targetId]!, graphPresentations: presentation },
          },
        },
      };
    case 'globalEffect':
      return {
        ...saved,
        definitionLibrary: {
          ...library,
          globalEffects: {
            ...library.globalEffects,
            [targetId]: {
              ...library.globalEffects![targetId]!,
              graphPresentations: presentation,
            },
          },
        },
      };
  }
}
