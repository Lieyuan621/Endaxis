import type { OperatorDefinition } from '../../../core/game-data/operatorDefinition';
import { listOperatorSkillDefinitionBindings } from '../../../core/game-data/operatorSkillDefinitions';
import type { ScenarioDocument } from '../../../core/project/schema';
import { getOperatorSkillIconPath, getWeaponActionIconPath } from '../../gameAssetPaths';

/** 结果来源显示所需的最小事实，不复制技能树或模拟状态。 */
export interface PublishedOperatorMetadata {
  readonly slug: string;
  readonly assetSlug: string;
  readonly displayName: string | undefined;
  readonly element: OperatorDefinition['element'];
  readonly talents: readonly PublishedUpgradeMetadata[];
  readonly potentials: readonly PublishedUpgradeMetadata[];
  readonly skillKeys: readonly string[];
  readonly skillIcons?: Readonly<Record<string, string>>;
  /** 单个技能自己的等级来源，用作缺少独立本地化标题时的显示回退。 */
  readonly skillLevelSources?: Readonly<Record<string, string>>;
}

type PublishedUpgradeMetadata = Pick<OperatorDefinition['talents'][number], 'levels'> & {
  readonly passiveKeys: readonly string[];
};

export function capturePublishedOperatorMetadata(
  scenario: ScenarioDocument,
  index: { getOperator(slug: string): OperatorDefinition | null },
): ReadonlyMap<string, PublishedOperatorMetadata> {
  const result = new Map<string, PublishedOperatorMetadata>();
  for (const track of scenario.tracks) {
    const slug = track?.operator?.operatorSlug;
    if (slug === undefined || result.has(slug)) continue;
    const definition = index.getOperator(slug);
    if (definition === null) continue;
    const bindings = listOperatorSkillDefinitionBindings(definition);
    const skills = bindings.map(binding => binding.skill);
    result.set(slug, {
      slug: definition.slug,

      assetSlug: definition.assetSlug ?? slug,
      displayName: definition.displayName,
      element: definition.element,
      talents: definition.talents.map(({ levels, passiveSkills }) => ({
        levels,
        passiveKeys: (passiveSkills ?? []).map(skill => skill.key),
      })),
      potentials: definition.potentials.map(({ levels, passiveSkills }) => ({
        levels,
        passiveKeys: (passiveSkills ?? []).map(skill => skill.key),
      })),
      skillKeys: skills.map(skill => skill.key),
      skillIcons: Object.fromEntries(
        bindings.map(({ group, skill }) => [
          skill.key,
          getOperatorSkillIconPath(definition.assetSlug ?? slug, group.skillType) ??
            getWeaponActionIconPath(definition.weaponType),
        ]),
      ),
      skillLevelSources: Object.fromEntries(
        skills
          .filter(skill => skill.levelSource !== undefined)
          .map(skill => [skill.key, skill.levelSource!]),
      ),
    });
  }
  return result;
}
