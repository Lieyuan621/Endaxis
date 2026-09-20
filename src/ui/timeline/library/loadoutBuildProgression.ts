import {
  createDefaultOperatorInstance,
  resolveMaxWeaponTraitLevels,
} from '../../../application/editor/loadoutBuildFactory';
import type { OperatorDefinition } from '../../../core/game-data/operatorDefinition';
import type { OperatorInstanceChanges, WeaponInstanceChanges } from './loadoutBuildCommands';
import type { OperatorInstanceViewModel, WeaponInstanceViewModel } from './loadoutBuildViewModel';
import {
  getOperatorSkillMax,
  getOperatorTrustMax,
  getWeaponTraitBounds,
  type OperatorLevel,
  type WeaponLevel,
} from '../../progression';

/**
 * 等级和晋升共同决定技能/信赖上限。一次用户操作必须把相关字段一起提交，不能留下超出当前养成
 * 阶段的实例状态。该函数只投影编辑器状态，不参与战斗数值计算。
 */
export function projectOperatorProgressionChange(
  operator: OperatorInstanceViewModel,
  level: OperatorLevel,
  requestedPromoted: boolean,
): OperatorInstanceChanges {
  const promoted = level === 1 ? false : level === 90 ? true : requestedPromoted;
  const skillMaximum = getOperatorSkillMax(level, promoted);
  const trustMaximum = getOperatorTrustMax(level, promoted);
  return {
    level,
    promoted,
    trustLevel: Math.min(Math.max(0, operator.trustLevel), trustMaximum),
    skillLevels: Object.fromEntries(
      Object.entries(operator.skillLevels).map(([key, value]) => [
        key,
        Math.min(Math.max(1, value), skillMaximum),
      ]),
    ),
  };
}

/** 六星没有默认满潜时保留玩家当前潜能；低星和显式默认潜能继续使用定义策略。 */
export function projectMaxOperatorChanges(
  operator: OperatorInstanceViewModel,
  definition: OperatorDefinition,
): OperatorInstanceChanges {
  const { operatorSlug: _operatorSlug, ...maximum } = createDefaultOperatorInstance(definition);
  return definition.rarity > 5 && definition.defaultPotential === undefined
    ? { ...maximum, potential: operator.potential }
    : maximum;
}

/** 低星武器拉满潜能；六星保留玩家当前潜能，并按该潜能解析满级特性边界。 */
export function projectMaxWeaponChanges(weapon: WeaponInstanceViewModel): WeaponInstanceChanges {
  const potential = weapon.definition.rarity <= 5 ? 5 : weapon.potential;
  return {
    level: 90,
    tuned: true,
    potential,
    traitLevels: resolveMaxWeaponTraitLevels(weapon.definition, potential),
  };
}

/**
 * 潜能改变会改变第三武器特性的固有起点；平移同样的差值可保留玩家额外投入的槽位数量。
 * 最终仍按当前定义的 levelCount 与当前等级/调谐边界收敛。
 */
export function projectWeaponPotentialChange(
  weapon: WeaponInstanceViewModel,
  nextPotential: number,
): WeaponInstanceChanges {
  const delta = nextPotential - weapon.potential;
  const traitLevels = clampWeaponTraitLevels(
    weapon,
    weapon.level as WeaponLevel,
    weapon.tuned,
    nextPotential,
    weapon.traitLevels.map((level, index) =>
      weapon.definition.traits[index]?.key === 'skill3' ? level + delta : level,
    ),
  );
  return { potential: nextPotential, traitLevels };
}

/** 等级 1/90 固定调谐状态；其他节点保留用户请求，并在同一次变更中收敛全部特性等级。 */
export function projectWeaponProgressionChange(
  weapon: WeaponInstanceViewModel,
  level: WeaponLevel,
  requestedTuned: boolean,
): WeaponInstanceChanges {
  const tuned = level === 1 ? false : level === 90 ? true : requestedTuned;
  return {
    level,
    tuned,
    traitLevels: clampWeaponTraitLevels(weapon, level, tuned, weapon.potential),
  };
}

function clampWeaponTraitLevels(
  weapon: WeaponInstanceViewModel,
  level: WeaponLevel,
  tuned: boolean,
  potential: number,
  requestedLevels: readonly number[] = weapon.traitLevels,
): number[] {
  const bounds = getWeaponTraitBounds(level, tuned, potential);
  const traitLevels = weapon.definition.traits.map((trait, index) => {
    const requested = requestedLevels[index] ?? 1;
    const nativeBounds =
      trait.key === 'skill1' || trait.key === 'skill2' || trait.key === 'skill3'
        ? bounds[trait.key]
        : { min: 1, max: trait.levelCount };
    return Math.min(Math.max(requested, nativeBounds.min), nativeBounds.max, trait.levelCount);
  });
  return traitLevels;
}
