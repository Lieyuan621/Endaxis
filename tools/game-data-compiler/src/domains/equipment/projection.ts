/**
 * 兼容装备领域旧的公开名称。实际投影属于武器/装备共用的编译层，
 * 领域层不得再持有属性语义分派。
 */
export {
  projectBuildAttributeModifier as projectEquipmentAttributeModifier,
  type BuildAttributeModifierProjectionSource as EquipmentAttributeModifierProjectionSource,
  type ProjectedBuildAttribute as ProjectedEquipmentAttribute,
  type ProjectedBuildDamageScale as ProjectedEquipmentDamageScale,
  type ProjectedBuildModifierSource as ProjectedEquipmentModifierSource,
  type ProjectedBuildPanelStat as ProjectedEquipmentPanelStat,
} from '../../compiler/build/buildAttributeProjection.ts';
