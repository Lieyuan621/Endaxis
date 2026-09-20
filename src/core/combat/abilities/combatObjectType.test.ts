import { expect, it } from 'vitest';
import { matchesCombatObjectType, resolveCombatObjectType } from './combatObjectType';

it('类型集合保留敌人部件扩展和空集合语义', () => {
  expect(matchesCombatObjectType(['enemy'], 'enemyPart')).toBe(true);
  expect(matchesCombatObjectType(['enemyPart'], 'enemy')).toBe(false);
  expect(matchesCombatObjectType([], 'projectile')).toBe(false);
  expect(matchesCombatObjectType('all', 'projectile')).toBe(true);
  expect(matchesCombatObjectType('all', undefined)).toBe(false);
});
it('实体必须查询目录，不能默认当成能力实体', () => {
  const target = { kind: 'abilityEntity' as const, instanceId: 7 };
  expect(() => resolveCombatObjectType(target)).toThrow('instance directory');
  expect(resolveCombatObjectType(target, () => 'projectile')).toBe('projectile');
  expect(
    matchesCombatObjectType(
      ['abilityEntity'],
      resolveCombatObjectType(target, () => 'projectile'),
    ),
  ).toBe(false);
});
