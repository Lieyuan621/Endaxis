/**
 * 把只读定义转换为可编辑的初始养成实例。
 * 这里集中的是编辑器默认策略，不是游戏事实；调用方可在创建后通过命令修改。
 */
import type { GearDefinition, WeaponDefinition } from '../../core/game-data/equipmentDefinition';
import type { OperatorDefinition } from '../../core/game-data/operatorDefinition';
import { listOperatorSkillDefinitionBindings } from '../../core/game-data/operatorSkillDefinitions';
import type {
  GearInstanceDocument,
  OperatorInstanceDocument,
  WeaponInstanceDocument,
} from '../../core/project/schema';

export function createDefaultOperatorInstance(
  operator: OperatorDefinition,
): OperatorInstanceDocument {
  const skillLevels = Object.fromEntries(
    [
      ...new Set(
        listOperatorSkillDefinitionBindings(operator).flatMap(({ skill }) =>
          skill.levelSource === undefined ? [] : [skill.levelSource],
        ),
      ),
    ].map(source => [source, 12]),
  );
  return {
    operatorSlug: operator.slug,
    level: 90,
    promoted: true,
    potential: resolveDefaultOperatorPotential(operator),
    trustLevel: 4,
    skillLevels,
    talentStates: Object.fromEntries(
      operator.talents.map((talent, index) => [String(index), talent.levels]),
    ),
  };
}

export function createDefaultWeaponInstance(weapon: WeaponDefinition): WeaponInstanceDocument {
  const potential = weapon.rarity <= 5 ? 5 : 0;
  return {
    weaponSlug: weapon.slug,
    level: 90,
    tuned: true,
    potential,
    traitLevels: resolveMaxWeaponTraitLevels(weapon, potential),
  };
}

/** 与旧版时间轴选择及干员编辑器“拉满”按钮一致。 */
export function resolveDefaultOperatorPotential(operator: OperatorDefinition): number {
  return operator.defaultPotential ?? (operator.rarity <= 5 ? 5 : 0);
}

/**
 * 复现旧版 90 级、已调谐武器的词条上限：前两条随调谐达到 9，第三条由潜能达到 4..9。
 * 自定义/未来词条仍受定义自身 levelCount 限制，不把旧三槽身份外推成游戏规则。
 */
export function resolveMaxWeaponTraitLevels(weapon: WeaponDefinition, potential: number): number[] {
  return weapon.traits.map(trait => {
    if (trait.key === 'skill1' || trait.key === 'skill2') return Math.min(trait.levelCount, 9);
    if (trait.key === 'skill3') return Math.min(trait.levelCount, 4 + potential);
    return trait.levelCount;
  });
}

export function createDefaultGearInstance(
  gear: GearDefinition,
  artificingTier: number,
): GearInstanceDocument {
  return {
    gearSlug: gear.slug,
    artificingLevels: resolveGearArtificingLevels(gear, artificingTier),
  };
}

/** 装备精锻实例使用 0 基档位；每条词条的最大值由自身 levelCount 唯一决定。 */
export function resolveGearArtificingLevels(gear: GearDefinition, requestedTier: number): number[] {
  const tier = Number.isFinite(requestedTier) ? Math.max(0, Math.trunc(requestedTier)) : 0;
  return gear.traits.map(trait => Math.min(tier, Math.max(0, trait.levelCount - 1)));
}

export function resolveMaxGearArtificingLevels(gear: GearDefinition): number[] {
  return gear.traits.map(trait => Math.max(0, trait.levelCount - 1));
}
