import {
  parseAttributeTypeValue,
  parseModifierTypeValue,
  parseModifyAttributeTypeValue,
  type AttributeTypeSource,
  type ModifierTypeSource,
  type ModifyAttributeTypeSource,
} from './attributeModifiers.ts';
import {
  requireArray,
  requireExactFields,
  requireNonEmptyString,
  requireNonNegativeInteger,
  requireNumber,
  requireRecord,
  requireString,
} from './primitives.ts';

const TALENT_NODE_FIELDS = new Set([
  'attributeNodeInfo',
  'factorySkillNodeInfo',
  'nodeId',
  'nodeType',
  'passiveSkillNodeInfo',
  'requiredItem',
]);
const ATTRIBUTE_NODE_INFO_FIELDS = new Set([
  'attributeModifiers',
  'breakStage',
  'customIcon',
  'desc',
  'favorability',
  'title',
]);
const PASSIVE_SKILL_NODE_INFO_FIELDS = new Set([
  'breakStage',
  'iconId',
  'index',
  'level',
  'name',
  'talentEffectId',
]);
const ATTRIBUTE_MODIFIER_FIELDS = new Set([
  'attrType',
  'attrValue',
  'modifierType',
  'modifyAttributeType',
]);

export type TalentNodeTypeSource =
  'none' | 'characterBreak' | 'equipmentBreak' | 'attribute' | 'passiveSkill' | 'factorySkill';

export interface TalentAttributeModifierSource {
  readonly attributeType: AttributeTypeSource;
  readonly value: number;
  readonly modifierType: ModifierTypeSource;
  readonly modifyAttributeType: ModifyAttributeTypeSource;
}

export interface OperatorTalentNodeSource {
  readonly sourcePath: string;
  readonly nodeId: string;
  readonly nodeType: TalentNodeTypeSource;
  readonly breakStage: number;
  readonly attributeModifiers: readonly TalentAttributeModifierSource[];
  readonly talentEffectId: string;
  /** 原生被动节点的分组、等级和突破门槛；不能用 nodeId 的拼写反推。 */
  readonly passiveSkill: {
    readonly index: number;
    readonly level: number;
    readonly breakStage: number;
  };
}

/** 严格读取 CharGrowthTable.talentNodeMap 的原生字段。 */
export function parseOperatorTalentNodeSources(
  charGrowthTableValue: unknown,
  characterId: string,
  sourceName = 'CharGrowthTable',
): OperatorTalentNodeSource[] {
  const table = requireRecord(charGrowthTableValue, sourceName);
  const rowPath = `${sourceName}.${characterId}`;
  const row = requireRecord(table[characterId], rowPath);
  const nodeMapPath = `${rowPath}.talentNodeMap`;
  const nodeMap = requireRecord(row.talentNodeMap, nodeMapPath);
  return Object.entries(nodeMap).map(([nodeId, rawNode]) => {
    const nodePath = `${nodeMapPath}.${nodeId}`;
    const node = requireRecord(rawNode, nodePath);
    requireExactFields(node, TALENT_NODE_FIELDS, nodePath);
    const embeddedId = requireNonEmptyString(node.nodeId, `${nodePath}.nodeId`);
    if (embeddedId !== nodeId) {
      throw new Error(`${nodePath}: nodeId '${embeddedId}' does not match map key '${nodeId}'`);
    }
    const nodeType = parseTalentNodeType(node.nodeType, `${nodePath}.nodeType`);
    requireRecord(node.factorySkillNodeInfo, `${nodePath}.factorySkillNodeInfo`);
    requireArray(node.requiredItem, `${nodePath}.requiredItem`);

    const attributeInfoPath = `${nodePath}.attributeNodeInfo`;
    const attributeInfo = requireRecord(node.attributeNodeInfo, attributeInfoPath);
    requireExactFields(attributeInfo, ATTRIBUTE_NODE_INFO_FIELDS, attributeInfoPath);
    requireString(attributeInfo.customIcon, `${attributeInfoPath}.customIcon`);
    requireRecord(attributeInfo.desc, `${attributeInfoPath}.desc`);
    requireNonNegativeInteger(attributeInfo.favorability, `${attributeInfoPath}.favorability`);
    requireRecord(attributeInfo.title, `${attributeInfoPath}.title`);
    const attributeModifiers = requireArray(
      attributeInfo.attributeModifiers,
      `${attributeInfoPath}.attributeModifiers`,
    ).map((rawModifier, index) =>
      parseTalentAttributeModifier(
        rawModifier,
        `${attributeInfoPath}.attributeModifiers[${index}]`,
      ),
    );

    const passiveInfoPath = `${nodePath}.passiveSkillNodeInfo`;
    const passiveInfo = requireRecord(node.passiveSkillNodeInfo, passiveInfoPath);
    requireExactFields(passiveInfo, PASSIVE_SKILL_NODE_INFO_FIELDS, passiveInfoPath);
    const passiveBreakStage = requireNonNegativeInteger(
      passiveInfo.breakStage,
      `${passiveInfoPath}.breakStage`,
    );
    requireString(passiveInfo.iconId, `${passiveInfoPath}.iconId`);
    const passiveIndex = requireNonNegativeInteger(passiveInfo.index, `${passiveInfoPath}.index`);
    const passiveLevel = requireNonNegativeInteger(passiveInfo.level, `${passiveInfoPath}.level`);
    requireRecord(passiveInfo.name, `${passiveInfoPath}.name`);

    return {
      sourcePath: nodePath,
      nodeId,
      nodeType,
      breakStage: requireNonNegativeInteger(
        attributeInfo.breakStage,
        `${attributeInfoPath}.breakStage`,
      ),
      attributeModifiers,
      talentEffectId: requireString(
        passiveInfo.talentEffectId,
        `${passiveInfoPath}.talentEffectId`,
      ),
      passiveSkill: { index: passiveIndex, level: passiveLevel, breakStage: passiveBreakStage },
    };
  });
}

function parseTalentAttributeModifier(value: unknown, path: string): TalentAttributeModifierSource {
  const modifier = requireRecord(value, path);
  requireExactFields(modifier, ATTRIBUTE_MODIFIER_FIELDS, path);
  return {
    attributeType: parseAttributeTypeValue(modifier.attrType, `${path}.attrType`),
    value: requireNumber(modifier.attrValue, `${path}.attrValue`),
    modifierType: parseModifierTypeValue(modifier.modifierType, `${path}.modifierType`),
    modifyAttributeType: parseModifyAttributeTypeValue(
      modifier.modifyAttributeType,
      `${path}.modifyAttributeType`,
    ),
  };
}

function parseTalentNodeType(value: unknown, path: string): TalentNodeTypeSource {
  const names: readonly TalentNodeTypeSource[] = [
    'none',
    'characterBreak',
    'equipmentBreak',
    'attribute',
    'passiveSkill',
    'factorySkill',
  ];
  const index = requireNonNegativeInteger(value, path);
  const result = names[index];
  if (result === undefined) throw new Error(`${path}: unknown TalentNodeType value ${index}`);
  return result;
}
