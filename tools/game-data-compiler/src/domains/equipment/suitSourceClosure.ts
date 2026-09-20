import { compilePassiveSkillRequestBatch } from '../../compiler/skills/passiveSkillBatch.ts';
import {
  createSkillDefinitionReferenceNode,
  parseBuffDefinitionReferenceNodes,
} from '../../compiler/references/referenceDefinitions.ts';
import { resolveDefinitionReferenceClosure } from '../../compiler/references/referenceClosure.ts';
import { requireRecord } from '../../source/primitives.ts';
import { discoverEquipmentSuitPassiveSkillRequests } from './passiveDiscovery.ts';

export interface CompiledEquipmentSuitSource {
  readonly suitId: string;
  readonly skillId: string;
  readonly skillLevel: number;
  readonly requiredCount: number;
}

export interface EquipmentSuitSourceClosure {
  readonly suits: readonly CompiledEquipmentSuitSource[];
  readonly passiveSkillDefinitionCount: number;
  readonly buffDefinitionIds: readonly string[];
}

/**
 * 关闭 EquipSuitTable → SkillData → BuffData 的静态定义引用。
 * Next 当前只表达三件套，因此其他阈值必须在进入正式 GearSetDefinition 前失败。
 */
export function compileEquipmentSuitSourceClosure(
  equipSuitTableValue: unknown,
  skillDataValue: unknown,
  skillPatchValue: unknown,
  buffDataValue: unknown,
  suitIds?: readonly string[],
): EquipmentSuitSourceClosure {
  const equipSuitTable = requireRecord(equipSuitTableValue, 'EquipSuitTable');
  const selectedSuitIds = [...(suitIds ?? Object.keys(equipSuitTable))].sort((left, right) =>
    left.localeCompare(right),
  );
  const requests = discoverEquipmentSuitPassiveSkillRequests(
    equipSuitTable,
    selectedSuitIds,
    'EquipSuitTable',
  );
  const suits = requests.map(request => {
    if (request.levelSource.kind !== 'equipmentSuitThreshold') {
      throw new Error(`${request.sourcePath}: expected equipment suit threshold`);
    }
    if (request.levelSource.requiredCount !== 3) {
      throw new Error(
        `${request.sourcePath}.equipCnt: Next GearSetDefinition requires exactly 3 pieces, found ${request.levelSource.requiredCount}`,
      );
    }
    return {
      suitId: request.originId,
      skillId: request.skillId,
      skillLevel: request.levelSource.level,
      requiredCount: request.levelSource.requiredCount,
    };
  });
  if (new Set(suits.map(suit => suit.suitId)).size !== suits.length) {
    throw new Error('EquipSuitTable: each suit must define exactly one threshold');
  }

  const passiveBatch = compilePassiveSkillRequestBatch(
    requests,
    skillDataValue,
    skillPatchValue,
    'SkillData',
  );
  const nodes = [
    ...passiveBatch.definitions.map(definition =>
      createSkillDefinitionReferenceNode(definition.definition.skill, definition.sourcePath),
    ),
    ...parseBuffDefinitionReferenceNodes(buffDataValue),
  ];

  const closure = resolveDefinitionReferenceClosure(
    passiveBatch.definitions.map(definition => ['skill', definition.skillId] as const),
    nodes,
  );
  if (closure.missing.length > 0) {
    const first = closure.missing[0]!;
    throw new Error(
      `${first.reference.sourcePath}: missing active ${first.reference.kind} definition ${JSON.stringify(first.reference.id)}`,
    );
  }
  return {
    suits,
    passiveSkillDefinitionCount: passiveBatch.definitions.length,
    buffDefinitionIds: closure.definitions
      .filter(definition => definition.kind === 'buff')
      .map(definition => definition.id)
      .sort((left, right) => left.localeCompare(right)),
  };
}
