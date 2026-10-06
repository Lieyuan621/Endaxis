import type { CombatObjectRef } from '../../../core/combat/receipt/combatReceipt';
import type {
  CombatObjectNode,
  CombatObjectOrigins,
} from '../../../core/projection/combatObjectOrigins';

export type CombatObjectOwnName = (node: CombatObjectNode) => string | undefined;

/** 名称查询只读取本次发布的事实；展示挂载、受益者和修正提供者不属于产生关系。 */
export function createCombatObjectNameResolver(
  origins: CombatObjectOrigins,
  ownName: CombatObjectOwnName,
) {
  const own = (ref: CombatObjectRef) => {
    const value = ownName(origins.get(ref));
    return value?.trim() ? value : undefined;
  };
  const inheritedName = (ref: CombatObjectRef) => {
    const result = origins.findAncestor(origins.get(ref), node => own(node.ref) !== undefined);
    return result.status === 'found' ? own(result.node.ref) : undefined;
  };
  return {
    /** 对象自身明确配置的名称，不继承、不以内部 ID 充当名称。 */
    own,
    /** 普通展示：自身未命名时，才使用最近的已命名产生者。 */
    display: (ref: CombatObjectRef) => own(ref) ?? inheritedName(ref),
    /** 名称查询：从直接来源开始追溯，不改变直接来源身份。 */
    sourceName: inheritedName,
  };
}
