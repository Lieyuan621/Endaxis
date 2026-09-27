import type { ProjectTemplateEdit } from '../../application/editor/projectTemplateCommands';
import type { ConsumableDefinition } from '../../core/game-data/consumableDefinition';
import type { EnemyDefinition } from '../../core/game-data/enemyDefinition';
import type { SkillBuffDefinition } from '../../../packages/game-data-contract/src/buffs';
import type { ContingencyContractTagDefinition } from '../../../packages/game-data-contract/src/mechanics';

/** 浏览范围独立于项目可保存的模板类型；公共资源不会被伪装成干员模板。 */
export type WorkspaceAssetDefinition =
  | ProjectTemplateEdit
  | { readonly kind: 'contract'; readonly definition: ContingencyContractTagDefinition }
  | { readonly kind: 'consumable'; readonly definition: ConsumableDefinition }
  | { readonly kind: 'enemy'; readonly definition: EnemyDefinition }
  | { readonly kind: 'buff'; readonly id: string; readonly definition: SkillBuffDefinition };

export function supportsCustomAsset(edit: WorkspaceAssetDefinition): edit is ProjectTemplateEdit {
  return (
    edit.kind === 'operator' ||
    edit.kind === 'weapon' ||
    edit.kind === 'gear' ||
    edit.kind === 'gearSet' ||
    edit.kind === 'globalEffect'
  );
}
