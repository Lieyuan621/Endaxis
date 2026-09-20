/**
 * 把战斗实体身份与其属性集、主副属性元数据绑定，供 Buff index 的跨实体属性读取 port 使用。
 * 注册表只负责定位和阶段读取，不创建面板数据；调用方必须先完成真实养成与装备属性编译。
 */
import { OPERATOR_ATTRIBUTES, type OperatorAttribute } from '../../game-data/operatorDefinition';
import type {
  CombatBuffDefinitionAttributeReadRequest,
  CombatBuffDefinitionCompilerPorts,
} from '../buffs/combatBuffDefinitions';
import { ATTRIBUTE_MODIFIER_SOURCES } from '../state/foundationState';
import { type CombatAttributeSet } from './combatAttributes';

/** 一个可按来源身份读取的战斗实体属性上下文。 */
export interface CombatAttributeEntity<Key extends string> {
  readonly entityId: string;
  readonly attributes: CombatAttributeSet<Key>;
  readonly mainAttribute: OperatorAttribute;
  readonly secondaryAttribute: OperatorAttribute;
}

/**
 * 单次战斗使用的实体属性索引。实例不得跨模拟复用，避免来源身份指向上一场战斗的可变属性集。
 */
export class CombatAttributeEntityRegistry<Key extends string> {
  readonly #entities = new Map<string, CombatAttributeEntity<Key>>();

  register(entity: CombatAttributeEntity<Key>): void {
    if (entity.entityId.length === 0)
      throw new Error('combat attribute entity id must not be empty');
    if (this.#entities.has(entity.entityId)) {
      throw new Error(`duplicate combat attribute entity '${entity.entityId}'`);
    }
    this.#entities.set(entity.entityId, entity);
  }

  /** 按 StoreAttributeValue 的已确认语义读取来源实体属性。 */
  read(sourceId: string, request: CombatBuffDefinitionAttributeReadRequest): number {
    const entity = this.#entities.get(sourceId);
    if (entity === undefined) {
      throw new Error(`combat attribute source '${sourceId}' is not configured`);
    }
    const keys = resolveAttributeKeys(entity, request);
    return keys.reduce(
      (total, key) => total + readNonConvertedStage(entity, key, request.stage),
      0,
    );
  }
}

/** 把实体属性注册表适配成 CombatBuffDefinitionCompilerPorts.readAttribute。 */
export function createCombatBuffDefinitionAttributeReader<Key extends string>(
  registry: CombatAttributeEntityRegistry<Key>,
): NonNullable<CombatBuffDefinitionCompilerPorts<Key>['readAttribute']> {
  return (request, buff) => registry.read(buff.sourceId, request);
}

function resolveAttributeKeys<Key extends string>(
  entity: CombatAttributeEntity<Key>,
  request: CombatBuffDefinitionAttributeReadRequest,
): readonly string[] {
  switch (request.attribute.kind) {
    case 'specific':
      return [request.attribute.key];
    case 'main':
      return [entity.mainAttribute];
    case 'secondary':
      return [entity.secondaryAttribute];
    case 'all':
      // 原生 All 明确为四维属性之和，不包含攻击、生命等其他属性。
      return OPERATOR_ATTRIBUTES;
  }
}

function readNonConvertedStage<Key extends string>(
  entity: CombatAttributeEntity<Key>,
  attribute: string,
  stage: CombatBuffDefinitionAttributeReadRequest['stage'],
): number {
  if (!entity.attributes.has(attribute)) {
    throw new Error(`combat attribute entity '${entity.entityId}' has no attribute '${attribute}'`);
  }
  const key = attribute as Key;
  return stage === 'armedNonConverted'
    ? entity.attributes.getArmed(key, ATTRIBUTE_MODIFIER_SOURCES.nonConverted)
    : entity.attributes.get(key, ATTRIBUTE_MODIFIER_SOURCES.nonConverted);
}
