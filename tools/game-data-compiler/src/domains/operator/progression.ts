import type { PassiveSkillCompileRequestSource } from '../../compiler/skills/passiveSkillRequest.ts';
import {
  compileBuildConditionIndexSource,
  type CompiledBuildConditionSource,
} from '../../compiler/conditions/buildCondition.ts';
import {
  parseOperatorPotentialSource,
  type OperatorPotentialSource,
} from '../../source/operatorPotentials.ts';
import {
  parseOperatorProgressionEffectBundles,
  type OperatorProgressionEffectBundleSource,
} from '../../source/operatorProgressionEffects.ts';
import {
  parseOperatorTalentNodeSources,
  type OperatorTalentNodeSource,
} from '../../source/operatorTalentNodes.ts';
import {
  parseSkillConditionSources,
  type SkillConditionSource,
} from '../../source/skillConditions.ts';
import type { OperatorCharacterTableSource } from './characterTable.ts';
import { discoverOperatorPassiveSkillRequestsFromBundles } from './passiveDiscovery.ts';
import {
  compileTrustAttributeBonusSource,
  type CompiledTrustAttributeBonusSource,
} from './talentNodes.ts';
import {
  compileOperatorProgressionEffectBundles,
  type CompiledOperatorProgressionEffectBundleSource,
} from './progressionEffects.ts';

export interface OperatorProgressionSource {
  readonly potential: OperatorPotentialSource;
  readonly talentNodes: readonly OperatorTalentNodeSource[];
  readonly effectBundles: readonly OperatorProgressionEffectBundleSource[];
  readonly skillConditions: readonly SkillConditionSource[];
  readonly compiledSkillConditions: ReadonlyMap<string, CompiledBuildConditionSource>;
  readonly compiledEffectBundles: readonly CompiledOperatorProgressionEffectBundleSource[];
  readonly talentPassiveSkillRequests: readonly PassiveSkillCompileRequestSource[];
  readonly potentialPassiveSkillRequests: readonly PassiveSkillCompileRequestSource[];
  readonly trustAttributeBonus: CompiledTrustAttributeBonusSource | null;
}

/**
 * 组装干员专有的天赋和潜能入口。两类效果分别保留原生顺序，只共享按 ID 唯一读取的效果包。
 */
export function parseOperatorProgressionSource(
  character: Pick<OperatorCharacterTableSource, 'characterId' | 'mainAttribute'>,
  charGrowthTableValue: unknown,
  characterPotentialTableValue: unknown,
  potentialTalentEffectTableValue: unknown,
  skillConditionTableValue: unknown,
): OperatorProgressionSource {
  const talentNodes = parseOperatorTalentNodeSources(charGrowthTableValue, character.characterId);
  const potential = parseOperatorPotentialSource(
    characterPotentialTableValue,
    character.characterId,
  );
  const talentEffectIds = talentNodes
    .filter(node => node.nodeType === 'passiveSkill')
    .map(node => node.talentEffectId);
  if (talentEffectIds.some(effectId => !effectId)) {
    throw new Error('talentNodeMap: passive skill node has empty talentEffectId');
  }
  const potentialEffectIds = potential.unlocks.map(unlock => unlock.effectId);
  const effectIds = distinctInOrder([...talentEffectIds, ...potentialEffectIds]);
  const effectBundles = parseOperatorProgressionEffectBundles(
    potentialTalentEffectTableValue,
    effectIds,
  );
  const conditionIds = distinctInOrder(
    effectBundles.flatMap(bundle =>
      bundle.entries.flatMap(entry => entry.activeConditions.filter(conditionId => conditionId)),
    ),
  );
  const skillConditions = parseSkillConditionSources(skillConditionTableValue, conditionIds);
  const compiledSkillConditions = compileBuildConditionIndexSource(skillConditions);
  const bundleById = new Map(effectBundles.map(bundle => [bundle.effectId, bundle]));

  return {
    potential,
    talentNodes,
    effectBundles,
    skillConditions,
    compiledSkillConditions,
    compiledEffectBundles: compileOperatorProgressionEffectBundles(
      effectBundles,
      compiledSkillConditions,
    ),
    talentPassiveSkillRequests: discoverOperatorPassiveSkillRequestsFromBundles(
      talentEffectIds.map(effectId => bundleById.get(effectId)!),
    ),
    potentialPassiveSkillRequests: discoverOperatorPassiveSkillRequestsFromBundles(
      potentialEffectIds.map(effectId => bundleById.get(effectId)!),
    ),
    trustAttributeBonus: compileTrustAttributeBonusSource(talentNodes, character.mainAttribute),
  };
}

function distinctInOrder(values: readonly string[]): string[] {
  const seen = new Set<string>();
  return values.filter(value => {
    if (seen.has(value)) return false;
    seen.add(value);
    return true;
  });
}
