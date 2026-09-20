import type { ContingencyContractTagDefinition } from '../../../packages/game-data-contract/src/mechanics';
import {
  contingencyContractBlockedTagReasons,
  contingencyContractOmittedTagReasons,
  contingencyContractTagDefinitions,
  contingencyContractInitializationPlans,
  contingencyContractEnemyMaxHealthPlans,
} from './generated/contingencyContractDefinitions.generated';
import { CONTINGENCY_CONTRACT_MECHANIC_PREFIX } from './contingencyContractAdapter';

export type ContingencyContractTagSupport = 'supported' | 'blocked' | 'omitted';

export interface ContingencyContractTagPresentation extends ContingencyContractTagDefinition {
  readonly support: ContingencyContractTagSupport;
  readonly supportReason?: string;
}

const supportedIds = new Set([
  ...contingencyContractInitializationPlans.map(plan => plan.tagId),
  ...contingencyContractEnemyMaxHealthPlans.map(plan => plan.tagId),
]);

export const contingencyContractTags: readonly ContingencyContractTagPresentation[] = Object.freeze(
  contingencyContractTagDefinitions.map(tag => {
    const support: ContingencyContractTagSupport = supportedIds.has(tag.tagId)
      ? 'supported'
      : Object.hasOwn(contingencyContractBlockedTagReasons, tag.tagId)
        ? 'blocked'
        : 'omitted';
    const supportReason =
      support === 'blocked'
        ? contingencyContractBlockedTagReasons[tag.tagId]
        : support === 'omitted'
          ? contingencyContractOmittedTagReasons[tag.tagId]
          : undefined;
    return Object.freeze({
      ...tag,
      lockIds: Object.freeze([...tag.lockIds]),
      blackboard: Object.freeze(tag.blackboard),
      support,
      ...(supportReason === undefined ? {} : { supportReason }),
    });
  }),
);

export function contingencyContractMechanicId(tagId: number): string {
  return `${CONTINGENCY_CONTRACT_MECHANIC_PREFIX}${tagId}`;
}

export function isContingencyContractTagLocked(
  selectedTagIds: readonly number[],
  tagId: number,
): boolean {
  const target = contingencyContractTags.find(tag => tag.tagId === tagId);
  if (target === undefined || selectedTagIds.includes(tagId) || target.lockIds.length === 0) {
    return false;
  }
  const selectedKeys = new Set(
    contingencyContractTags
      .filter(tag => selectedTagIds.includes(tag.tagId) && tag.keyId !== '')
      .map(tag => tag.keyId),
  );
  return target.lockIds.some(keyId => !selectedKeys.has(keyId));
}

/** 同一原生 conflictId 的不同等级互斥；其他已选词条保持原顺序。 */
export function toggleContingencyContractTag(
  selectedTagIds: readonly number[],
  tagId: number,
): readonly number[] {
  const target = contingencyContractTags.find(tag => tag.tagId === tagId);
  if (target === undefined) return selectedTagIds;
  if (selectedTagIds.includes(tagId)) return selectedTagIds.filter(id => id !== tagId);
  if (isContingencyContractTagLocked(selectedTagIds, tagId)) return selectedTagIds;
  const conflictingIds = new Set(
    contingencyContractTags
      .filter(tag => tag.conflictId !== '' && tag.conflictId === target.conflictId)
      .map(tag => tag.tagId),
  );
  return [...selectedTagIds.filter(id => !conflictingIds.has(id)), tagId];
}
