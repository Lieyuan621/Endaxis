import type { OperatorDefinition } from '../../../../../packages/game-data-contract/src/operators.ts';
import type { CompiledOperatorAttributeGrowthSource } from './characterTable.ts';
import type { OperatorSourceClosure } from './sourceClosure.ts';
import type { CompiledTrustAttributeBonusSource } from './talentNodes.ts';

/**
 * 已能无损写入 OperatorDefinition 的静态头部。
 * slug/gameId 是 Endaxis 产品身份，不从 CharacterTable 的显示字段猜测；技能与养成行为也由后续
 * 专用编译阶段装配。因此该结构不能单独注册为完整干员定义。
 */
export type CompiledOperatorDefinitionHeaderSource = Readonly<
  Pick<
    OperatorDefinition,
    | 'slug'
    | 'gameId'
    | 'rarity'
    | 'weaponType'
    | 'element'
    | 'role'
    | 'mainAttribute'
    | 'secondaryAttribute'
  >
> & {
  /** 编译期来源追踪，不写入正式产物。 */
  readonly sourceCharacterId: string;
  readonly attributes: CompiledOperatorAttributeGrowthSource;
  readonly trustAttributeBonus?: CompiledTrustAttributeBonusSource;
};

/** 从同一个严格 Operator 来源闭包组装正式定义头部，不重新读取原始表。 */
export function compileOperatorDefinitionHeaderSource(
  closure: Pick<
    OperatorSourceClosure,
    'identity' | 'character' | 'attributeGrowth' | 'progression'
  >,
): CompiledOperatorDefinitionHeaderSource {
  const { character } = closure;
  return {
    slug: closure.identity.slug,
    gameId: closure.identity.gameId,
    sourceCharacterId: character.characterId,
    rarity: character.projectedRarity,
    weaponType: character.weaponType,
    element: character.element,
    role: character.role,
    mainAttribute: character.mainAttribute,
    secondaryAttribute: character.secondaryAttribute,
    attributes: closure.attributeGrowth,
    ...(closure.progression.trustAttributeBonus === null
      ? {}
      : { trustAttributeBonus: closure.progression.trustAttributeBonus }),
  };
}
