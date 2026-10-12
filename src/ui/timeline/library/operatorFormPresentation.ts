import type { OperatorSkillDefinitionBinding } from '../../../core/game-data/operatorSkillDefinitions';
import { resolveImage } from '../../imageResources';
import { defaultOperatorSkillIconPath } from '../../gameAssetPaths';
import type { OperatorPanelAttributes } from '../../../core/compiler/resolveOperatorPanel';
import type { OperatorDefinition } from '../../../core/game-data/operatorDefinition';
import { compareCombatNumbers } from '../../../core/math/combatNumbers.ts';

/** 按定义中的构筑条件和最终面板选择展示形态。 */
export function resolveOperatorPresentationFormKey(
  definition: Readonly<OperatorDefinition>,
  attributes: Readonly<OperatorPanelAttributes>,
): string | null {
  for (const group of definition.skillGroups) {
    for (const variant of group.presentationVariants ?? []) {
      if (
        compareCombatNumbers(
          attributes[variant.condition.left],
          attributes[variant.condition.right],
          variant.condition.operator,
        )
      ) {
        return variant.key;
      }
    }
  }
  return null;
}

/** 普通武器动作固定使用武器图标；其余按条件覆盖、指定名称、默认图标解析。 */
export function resolveOperatorSkillIcon(
  { skill, group }: OperatorSkillDefinitionBinding,
  formKey: string | null,
  operator: Pick<OperatorDefinition, 'slug' | 'assetSlug' | 'weaponType'>,
): string {
  const slug = operator.assetSlug ?? operator.slug;
  const fallback = defaultOperatorSkillIconPath(slug, operator.weaponType, skill.skillType);
  if (['basicAttack', 'plungingAttack', 'finisher'].includes(skill.skillType)) return fallback;
  const icon =
    (skill.useSkillGroupIcon
      ? group.presentationVariants?.find(variant => variant.key === formKey)?.icon
      : undefined) ?? skill.icon;
  return resolveImage(icon) ?? fallback;
}
