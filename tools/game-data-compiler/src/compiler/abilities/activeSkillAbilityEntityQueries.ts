import type { GameplayTagRegistry } from '../../source/nativeGameplayTags.ts';
import type { CompiledActiveSkillSource } from '../skills/activeSkillDefinition.ts';
import {
  compileTargetGroupAbilityEntityQuerySource,
  type CompiledAbilityEntitySelectorQuerySource,
} from './abilityEntityQuery.ts';
import type { CompiledAbilityEntityTemplateCatalogSource } from './abilityEntityCatalog.ts';
import { collectNativeActionNodes } from '../../source/controlFlow.ts';

export interface CompiledActiveSkillAbilityEntityQuerySource {
  readonly targetGroupKey: string;
  readonly startFrame: number;
  readonly endFrame: number;
  readonly actionPath: readonly string[];
  readonly sourcePath: string;
  readonly query: CompiledAbilityEntitySelectorQuerySource;
}

/**
 * 把主动 SkillData 已收集的目标组写入连接到公共 AbilityEntity 查询 IR。
 * 此处只选择原生 OwnerSpawnedEntityFinder；Operator 领域不会重新解释 finder 或 validator。
 */
export function compileActiveSkillAbilityEntityQueriesSource(
  source: CompiledActiveSkillSource,
  catalog: CompiledAbilityEntityTemplateCatalogSource,
  registry: GameplayTagRegistry,
): CompiledActiveSkillAbilityEntityQuerySource[] {
  const actionSourcePaths = new Set(
    source.skill.actionGraph.actionGroup.timelineActions.flatMap(timeline =>
      collectNativeActionNodes(timeline.sequence).map(node => node.sourcePath),
    ),
  );
  return source.targetGroupWrites
    .filter(write => write.finderType === 'OwnerSpawnedEntityFinder')
    .map(write => {
      if (!actionSourcePaths.has(write.sourcePath)) {
        throw new Error(
          `${write.sourcePath}: target-group write is not present in the compiled action graph`,
        );
      }
      return {
        targetGroupKey: write.targetGroupKey,
        startFrame: write.startFrame,
        endFrame: write.endFrame,
        actionPath: write.actionPath,
        sourcePath: write.sourcePath,
        query: compileTargetGroupAbilityEntityQuerySource(
          write,
          catalog,
          registry,
          write.sourcePath,
        ),
      };
    });
}
