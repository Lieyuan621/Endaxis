import type { SkillBuffDefinition } from '../../../packages/game-data-contract/src/buffs';
import type { GlobalConfigDocument } from '../project/schema';
import type { CompiledMechanics } from '../mechanics/mechanicCompiler';
import { compileIndependentBuffResource } from './compileSkill';
import { ActionGraphDefinitionRepository } from './actionGraphDefinitionRepository';

export type GlobalEffectDefinitionSource = Pick<
  import('../game-data/gameDataRepository').GameDataRepository,
  'actionPrograms' | 'getGlobalEffect'
>;

/** 全局效果仅提供 Buff 资源和机制初始化序列，不另设属性计算路径。 */
export function compileGlobalEffects(
  config: GlobalConfigDocument,
  repository: GlobalEffectDefinitionSource,
): CompiledMechanics {
  const programs = repository.actionPrograms ?? new ActionGraphDefinitionRepository();
  const definitions: Record<string, SkillBuffDefinition> = {};
  const ids = new Set<string>();
  for (const reference of config.effects ?? []) {
    if (ids.has(reference.effectId))
      throw new Error(`duplicate global effect reference '${reference.effectId}'`);
    ids.add(reference.effectId);
    const definition = repository.getGlobalEffect(reference.effectId);
    if (definition === null) throw new Error(`unknown global effect '${reference.effectId}'`);
    if (definition.id !== reference.effectId)
      throw new Error(
        `global effect '${reference.effectId}' resolved to mismatched definition '${definition.id}'`,
      );
    if (reference.enabled) definitions[`scenario:effect:${definition.id}`] = definition.buff;
  }
  if (config.customBuff) definitions['scenario:custom-values'] = config.customBuff;
  const buffDefinitions = Object.fromEntries(
    Object.entries(definitions).map(([id, buff]) => [
      id,
      compileIndependentBuffResource(buff, id, programs),
    ]),
  );
  return {
    sources: [],
    buffDefinitions,
    contributions: Object.keys(definitions).map((buffId, index) => ({
      selectionId: buffId,
      mechanicId: buffId,
      selectionIndex: index,
      contributionIndex: 0,
      contribution: {
        kind: 'battleInitializationSequence',
        sequence: programs
          .compile(
            {
              nodes: {
                initialize: {
                  action: {
                    kind: 'createGlobalBuff',
                    parameters: {
                      globalBuffId: buffId,
                      source: 'battle',
                      blackboardAssignments: {},
                      definition: {
                        stackingType: 'unlimited',
                        blackboard: {},
                        children: [{ buffId, blackboardAssignments: {} }],
                      },
                    },
                  },
                  next: null,
                },
              },
            },
            0,
          )
          .compileEntry({ $sequence: 'initialize' }, `ScenarioMechanics.${buffId}`),
      },
    })),
  };
}
