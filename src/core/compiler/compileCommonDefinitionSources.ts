import type { CommonDefinitionSource } from '../game-data/gameDataRepository';
import type { OperatorAbilityEntityDefinitions } from '../game-data/operatorDefinition';
import type { ActionGraphDefinitionRepository } from './actionGraphDefinitionRepository';
import { compileIndependentBuffResource } from './compileSkill';
import { createIndependentAbilityEntityImportResolver } from './compileCommonAbilityEntityImports';

/** 来源只组织目录；资源不能借用来源总图或其他资源的图。 */
export function compileCommonDefinitionSources(
  sources: readonly CommonDefinitionSource[],
  programs: ActionGraphDefinitionRepository,
) {
  const entities: Record<string, OperatorAbilityEntityDefinitions[string]> = {};
  const graphs = new Set<object>();
  for (const source of sources) {
    for (const [id, definition] of Object.entries(source.abilityEntityDefinitions ?? {})) {
      if (Object.hasOwn(entities, id))
        throw new Error(`duplicate common AbilityEntity definition '${id}'`);
      Object.defineProperty(entities, id, { value: definition, enumerable: true });
    }
    for (const [id, definition] of [
      ...Object.entries(source.buffDefinitions ?? {}),
      ...Object.entries(source.abilityEntityDefinitions ?? {}).flatMap(([id, entity]) =>
        [
          ...(entity.childSkill ? [entity.childSkill] : []),
          ...Object.values(entity.childSkills ?? {}),
          ...(entity.passiveSkills ?? []),
        ].map((skill, index) => [`${id}.skills[${index}]`, skill] as const),
      ),
    ]) {
      if (definition.actionGraph === undefined) continue;
      if (graphs.has(definition.actionGraph))
        throw new Error(`common resource '${id}' shares another resource's action graph`);
      graphs.add(definition.actionGraph);
    }
  }
  const importsForLevel = createIndependentAbilityEntityImportResolver(entities, programs);
  const buffDefinitions: Record<string, ReturnType<typeof compileIndependentBuffResource>> = {};
  for (const source of sources) {
    for (const [id, definition] of Object.entries(source.buffDefinitions ?? {})) {
      if (Object.hasOwn(buffDefinitions, id))
        throw new Error(`duplicate common Buff definition '${id}'`);
      Object.defineProperty(buffDefinitions, id, {
        value: compileIndependentBuffResource(definition, id, programs, importsForLevel(0)),
        enumerable: true,
      });
    }
  }
  return { buffDefinitions, abilityEntityDefinitions: importsForLevel(0), importsForLevel };
}
