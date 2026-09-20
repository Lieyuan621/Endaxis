/** 实例编辑界面使用的养成范围与装备展示规则。 */

export type OperatorLevel = 1 | 20 | 40 | 60 | 80 | 90;
export type WeaponLevel = 1 | 20 | 40 | 60 | 80 | 90;

export interface WeaponTraitLevelBounds {
  readonly min: number;
  readonly max: number;
}

export interface WeaponTraitBounds {
  readonly skill1: WeaponTraitLevelBounds;
  readonly skill2: WeaponTraitLevelBounds;
  readonly skill3: WeaponTraitLevelBounds;
}

export function getOperatorSkillMax(level: OperatorLevel, promoted: boolean): number {
  if (level <= 20) return 3;
  if (level <= 40) return promoted ? 6 : 3;
  if (level <= 60) return promoted ? 9 : 6;
  if (level <= 80) return promoted ? 12 : 9;
  return 12;
}

export function formatOperatorSkillLevel(level: number): string {
  return level <= 9 ? String(level) : `M${level - 9}`;
}

export function getOperatorTrustMax(level: OperatorLevel, promoted: boolean): number {
  if (level >= 90) return 4;
  if (level >= 80) return promoted ? 4 : 3;
  if (level >= 60) return promoted ? 3 : 2;
  if (level >= 40) return promoted ? 2 : 1;
  if (level >= 20) return promoted ? 1 : 0;
  return 0;
}

export function getWeaponTraitBounds(
  level: WeaponLevel,
  tuned: boolean,
  potential: number,
): WeaponTraitBounds {
  const tuning =
    level === 1
      ? 0
      : level === 20
        ? tuned
          ? 1
          : 0
        : level === 40
          ? tuned
            ? 2
            : 1
          : level === 60
            ? tuned
              ? 3
              : 2
            : level === 80
              ? tuned
                ? 4
                : 3
              : 4;
  return {
    skill1: { min: 1 + Math.ceil(tuning / 2), max: 3 + Math.ceil(tuning * 1.5) },
    skill2: { min: 1 + Math.floor(tuning / 2), max: 3 + Math.floor(tuning * 1.5) },
    skill3: { min: 1 + potential, max: 4 + potential },
  };
}

export function getEquipmentLevelColor(level: number | string | null | undefined): string {
  const colors: Readonly<Record<number, string>> = {
    70: '#ffd700',
    60: '#ffd700',
    50: '#b37feb',
    36: '#4a90e2',
    28: '#73c94f',
    20: '#95de64',
    10: '#888888',
  };
  return colors[Number(level)] ?? '#888888';
}

export type EquipmentQualityTier = 'green' | 'blue' | 'purple' | 'gold';

/** 装备等级门槛对应的游戏品质；构筑界面用它显示与旧版一致的品质名称。 */
export function getEquipmentQualityTier(
  level: number | string | null | undefined,
): EquipmentQualityTier {
  const requirement = Number(level);
  if (requirement >= 60) return 'gold';
  if (requirement >= 40) return 'purple';
  if (requirement >= 20) return 'blue';
  return 'green';
}

export function isEquipmentArtificable(level: number | string | null | undefined): boolean {
  return Number(level) >= 60;
}
