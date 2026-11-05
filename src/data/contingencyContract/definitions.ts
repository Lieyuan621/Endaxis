import { commonBuffDefinitions } from '../buffs/commonDefinitions';
import {
  contingencyContractBuffDefinitions as generatedBuffs,
  contingencyContractInitializationPlans as generatedPlans,
} from './generated/contingencyContractDefinitions.generated';
import {
  contingencyContractBuffDefinitions as seasonTwoBuffs,
  contingencyContractInitializationPlans as seasonTwoPlans,
} from './generated/contingencyContract.indie_contract002.generated';
import {
  readContractInitialVariables,
  resolveInitialVariableOverrides,
  type ContractInitialVariable,
} from './initialVariables';

// 与敌人出生效果共用的 Buff 由公共定义仓库拥有，合约只保留自己的入口及专属定义。
export const contingencyContractBuffDefinitions = Object.fromEntries(
  Object.entries({ ...generatedBuffs, ...seasonTwoBuffs }).filter(
    ([id]) => !Object.hasOwn(commonBuffDefinitions, id),
  ),
);
export const contingencyContractInitializationPlans = [...generatedPlans, ...seasonTwoPlans];

// 各期定义在此装配；通用变量读取和覆盖逻辑不依赖任何具体期数。
const variables = new Map<number, readonly ContractInitialVariable[]>(
  contingencyContractInitializationPlans.map(plan => [
    plan.tagId,
    readContractInitialVariables(plan.actionGraph),
  ]),
);

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
  _tagId: number,
  defaults: Readonly<Record<string, number>>,
  values: Readonly<Record<string, number>>,
) {
  const merged = { ...defaults, ...values };
  return merged;
}
