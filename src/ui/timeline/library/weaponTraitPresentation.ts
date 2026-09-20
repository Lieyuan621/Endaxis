import type { WeaponTraitDefinition } from '../../../core/game-data/equipmentDefinition';
import {
  formatProjectedEquipmentModifierValue,
  projectEquipmentModifier,
} from './equipmentModifierPresentation';

/**
 * 旧版武器实例面板在特性名旁显示一个当前档数值。只有当前定义能唯一归纳为一项静态 modifier
 * 时才恢复该短标签；多修正和纯事件能力继续由完整富文本描述表达，不能擅自挑一个数值冒充全貌。
 */
export function getWeaponTraitValueText(trait: WeaponTraitDefinition, level: number): string {
  if (trait.modifiers?.length !== 1) return '';
  return formatProjectedEquipmentModifierValue(
    projectEquipmentModifier(trait.modifiers[0]!),
    Math.max(0, level - 1),
  );
}
