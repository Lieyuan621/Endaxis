import type { PublishedOperatorMetadata } from '../results/publishedOperatorMetadata';
import type { PublishedBuffSource } from '../results/publishedBuffSource';
import type { OperatorPanelContributionReceipt } from '../../../core/compiler/resolveOperatorPanel';
import {
  getGearPieceGameName,
  getGearSetGameName,
  getOperatorPotentialName,
  getOperatorTalentName,
  getWeaponGameName,
} from '../../gameText';

export interface OperatorPanelContributionPresentationContext {
  readonly operator: {
    readonly slug: string;
    readonly talents: readonly Pick<PublishedOperatorMetadata['talents'][number], 'levels'>[];
    readonly potentials: readonly Pick<PublishedOperatorMetadata['potentials'][number], 'levels'>[];
  } | null;
  readonly locale: string;
  readonly weapons?: ReadonlyMap<string, PublishedBuffSource>;
  readonly translate: (key: string, params?: Record<string, unknown>) => string;
}

/**
 * 面板和伤害详情共用同一静态构筑来源名称。它只解释 resolver 已经给出的来源身份，
 * 不根据数值或技能名称反推来源。
 */
export function resolveOperatorPanelContributionSourceLabel(
  entry: Pick<OperatorPanelContributionReceipt, 'source'>,
  context: OperatorPanelContributionPresentationContext,
): string {
  const source = entry.source;
  const weaponName = (slug: string) => {
    const identity = context.weapons?.get(slug);
    return identity?.kind === 'weapon'
      ? (identity.name ?? getWeaponGameName(identity.slug, context.locale))
      : getWeaponGameName(slug, context.locale);
  };
  if (source.kind === 'operatorBase') return context.translate('statDetail.baseSource');
  if (source.kind === 'trust') {
    return context.translate('timeline.panel.trustNode', { node: source.node });
  }
  if (source.kind === 'weaponBase') return weaponName(source.weaponSlug);
  if (source.kind === 'gearBase') return getGearPieceGameName(source.gearSlug, context.locale);
  if (source.kind === 'operatorUpgrade') {
    const operator = context.operator;
    if (operator !== null) {
      const talentIndex = source.index;
      if (source.source === 'talent' && operator.talents[talentIndex]) {
        const flatIndex = operator.talents
          .slice(0, talentIndex)
          .reduce((sum, value) => sum + value.levels, 0);
        return getOperatorTalentName(operator.slug, flatIndex, 0, context.locale);
      }
      const potentialIndex = source.index;
      if (source.source === 'potential' && operator.potentials[potentialIndex]) {
        const flatIndex = operator.potentials
          .slice(0, potentialIndex)
          .reduce((sum, value) => sum + value.levels, 0);
        return getOperatorPotentialName(operator.slug, flatIndex, context.locale);
      }
    }
    return `${source.source} ${source.index + 1}`;
  }
  const contribution = source.contribution;
  if (contribution.kind === 'weaponTrait') {
    return weaponName(contribution.slug);
  }
  if (contribution.kind === 'gearTrait') {
    return getGearPieceGameName(contribution.slug, context.locale);
  }
  return getGearSetGameName(contribution.slug, context.locale);
}
