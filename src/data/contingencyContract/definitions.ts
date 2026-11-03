import { commonBuffDefinitions } from '../buffs/commonDefinitions';
import {
  contingencyContractBuffDefinitions as generatedBuffs,
  contingencyContractInitializationPlans as generatedPlans,
} from './generated/contingencyContractDefinitions.generated';
import {
  seasonTwoEntryBuffs,
  seasonTwoPreviewPlans,
  seasonTwoVariableMetadata,
  seasonTwoDisplayValues,
} from './previewSeasonTwo';
import {
  readContractInitialVariables,
  resolveInitialVariableOverrides,
  type ContractInitialVariable,
} from './initialVariables';

// 与敌人出生效果共用的 Buff 由公共定义仓库拥有，合约只保留自己的入口及专属定义。
export const contingencyContractBuffDefinitions = Object.fromEntries(
  Object.entries({ ...generatedBuffs, ...seasonTwoEntryBuffs }).filter(
    ([id]) => !Object.hasOwn(commonBuffDefinitions, id),
  ),
);
export const contingencyContractInitializationPlans = [...generatedPlans, ...seasonTwoPreviewPlans];

// 各期定义在此装配；通用变量读取和覆盖逻辑不依赖任何具体期数。
const variables = new Map<number, readonly ContractInitialVariable[]>([
  ...generatedPlans.map(
    plan => [plan.tagId, readContractInitialVariables(plan.actionGraph)] as const,
  ),
  ...seasonTwoPreviewPlans.map(
    plan =>
      [
        plan.tagId,
        readContractInitialVariables(plan.actionGraph, seasonTwoVariableMetadata[plan.tagId]),
      ] as const,
  ),
]);
const previewTagIds = new Set(seasonTwoPreviewPlans.map(plan => plan.tagId));

export function contractInitialVariables(tagId: number): readonly ContractInitialVariable[] {
  return variables.get(tagId) ?? [];
}

export function resolveContractInitialVariables(
  tagId: number,
  overrides: Readonly<Record<string, unknown>>,
) {
  return resolveInitialVariableOverrides(contractInitialVariables(tagId), overrides);
}

export function contractDisplayBlackboard(
  tagId: number,
  defaults: Readonly<Record<string, number>>,
  values: Readonly<Record<string, number>>,
) {
  const merged = { ...defaults, ...values };
  return previewTagIds.has(tagId) ? seasonTwoDisplayValues(merged) : merged;
}
