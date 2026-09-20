import type { MechanicSelectionDocument } from '../../core/project/schema';
import { gameLocaleRegistry } from '../../i18n/gameLocaleRegistry';
import { normalizeLocale } from '../../i18n/elementPlusLocale';
import {
  contingencyContractTags,
  type ContingencyContractTagPresentation,
} from '../../data/mechanics/contingencyContractCatalog';
import { CONTINGENCY_CONTRACT_MECHANIC_PREFIX } from '../../data/mechanics/contingencyContractAdapter';

const MECHANIC_INITIALIZATION_SOURCE_PREFIX = 'upgrade-initialization:mechanic:';

export interface ContingencyContractBuffPresentation {
  readonly selectionId: string;
  readonly tag: ContingencyContractTagPresentation;
}

/**
 * Resolve a displayed Buff back to the selected native contract tag which applied it.
 *
 * The Buff id remains its real runtime identity. Presentation follows the action receipt's
 * selection id instead, so two contract tags that happen to reuse one Buff definition are not
 * confused with each other.
 */
export function resolveContingencyContractBuffPresentation(
  sourceActionId: string | undefined,
  selections: readonly MechanicSelectionDocument[],
): ContingencyContractBuffPresentation | undefined {
  if (sourceActionId?.startsWith(MECHANIC_INITIALIZATION_SOURCE_PREFIX) !== true) {
    return undefined;
  }
  const actionIdentity = sourceActionId.slice(MECHANIC_INITIALIZATION_SOURCE_PREFIX.length);
  const contributionSeparator = actionIdentity.lastIndexOf(':');
  if (contributionSeparator < 0) return undefined;
  const contributionIndex = actionIdentity.slice(contributionSeparator + 1);
  if (!/^\d+$/.test(contributionIndex)) return undefined;

  const selectionId = actionIdentity.slice(0, contributionSeparator);
  const selection = selections.find(candidate => candidate.id === selectionId && candidate.enabled);
  if (selection?.mechanicId.startsWith(CONTINGENCY_CONTRACT_MECHANIC_PREFIX) !== true) {
    return undefined;
  }
  const tagId = Number(selection.mechanicId.slice(CONTINGENCY_CONTRACT_MECHANIC_PREFIX.length));
  if (!Number.isInteger(tagId)) return undefined;
  const tag = contingencyContractTags.find(candidate => candidate.tagId === tagId);
  return tag === undefined ? undefined : { selectionId, tag };
}

export function localizedContingencyContractTagName(
  tag: ContingencyContractTagPresentation,
  locale: string,
): string {
  const name = contingencyContractTagText(tag, locale).name;
  return tag.romanNumSuffix === '' ? name : `${name} ${tag.romanNumSuffix}`;
}

export function contingencyContractTagText(
  tag: ContingencyContractTagPresentation,
  locale: string,
) {
  const texts = gameLocaleRegistry.getFamily(normalizeLocale(locale), 'contingency-contracts');
  const text = texts[String(tag.tagId)];
  if (text === undefined) throw new Error(`Contingency Contract text ${tag.tagId} is missing`);
  return text;
}

export function formatContingencyContractBuffSourceName(
  contractLabel: string,
  operationName: string,
  tagName: string,
): string {
  return `${contractLabel}「${operationName}」· ${tagName}`;
}
