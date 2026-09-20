import type { PassiveSkillCompileRequestSource } from '../../compiler/skills/passiveSkillRequest.ts';
import { parseWeaponBasicSources } from './basicTable.ts';

/** 武器只负责发现 CardSkill 及其等级来源；SkillData 行为仍进入公共被动编译器。 */
export function discoverWeaponPassiveSkillRequests(
  value: unknown,
  weaponIds: readonly string[],
  sourceName = 'WeaponBasicTable',
): PassiveSkillCompileRequestSource[] {
  return parseWeaponBasicSources(value, weaponIds, sourceName).flatMap(row =>
    row.skillIds.map((skillId, slotIndex): PassiveSkillCompileRequestSource => ({
      originKind: 'weapon',
      originId: row.weaponId,
      sourcePath: `${row.sourcePath}.weaponSkillList[${slotIndex}]`,
      skillId,
      levelSource: {
        kind: 'weaponProgression',
        slotIndex,
        breakthroughTemplateId: row.breakthroughTemplateId,
        talentTemplateId: row.talentTemplateId,
      },
      inputBlackboard: {},
    })),
  );
}
