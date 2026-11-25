import type { ActionTargetQuery } from '../../../../../packages/game-data-contract/src/conditions.ts';
import type { BuffValidatorSource } from '../../source/target.ts';
import {
  projectGameplayTags,
  type CombatActionProjectionContextSource,
} from '../combatProjectionCommon.ts';
import { projectNativeTagQueryType } from '../../source/tagQuery.ts';

/** 查询内部筛选；不新增行为节点，也不把当前 Buff 状态折叠为静态集合。 */
export function projectSelectorBuffValidators(
  targets: ActionTargetQuery,
  validators: readonly BuffValidatorSource[],
  context: CombatActionProjectionContextSource,
  path: string,
): ActionTargetQuery {
  for (const [index, validator] of validators.entries()) {
    const settings = validator.settings;
    if (settings.checkType !== 'Id' && settings.checkType !== 'Tag')
      throw new Error(
        `${path}.buffValidators[${index}]: unsupported ${settings.checkType} Buff query`,
      );
    targets = {
      kind: 'buffFilter',
      targets,
      requireBuff: validator.mode === 'HasBuff',
      query:
        settings.checkType === 'Id'
          ? { kind: 'id', buffIds: settings.buffIds }
          : {
              kind: 'tag',
              buffTags: projectGameplayTags(settings.tagQuery.tagIds, context, path),
              tagQueryType: projectNativeTagQueryType(settings.tagQuery.queryType, path),
            },
    };
  }
  return targets;
}
