import {
  requireArray,
  requireExactFields,
  requireNonEmptyString,
  requireNonNegativeInteger,
  requireRecord,
  requireString,
} from '../../source/primitives.ts';
import { projectWeaponType } from '../../compiler/build/weaponType.ts';
import type { OperatorWeaponType } from '../../../../../packages/game-data-contract/src/primitives.ts';
import { parseWeaponTypeValue, type WeaponTypeSource } from '../../source/weaponType.ts';

const WEAPON_FIELDS = new Set([
  'breakthroughTemplateId',
  'engName',
  'levelTemplateId',
  'maxLv',
  'modelPath',
  'potentialUpItemList',
  'rarity',
  'talentTemplateId',
  'weaponDesc',
  'weaponId',
  'weaponPotentialSkill',
  'weaponSkillList',
  'weaponType',
]);

/** WeaponBasicTable 中供被动、成长和正式身份适配器共享的严格源行。 */
export interface WeaponBasicSource {
  readonly sourcePath: string;
  readonly weaponId: string;
  readonly levelTemplateId: string;
  readonly breakthroughTemplateId: string;
  readonly talentTemplateId: string;
  readonly maximumLevel: number;
  readonly rarity: number;
  readonly nativeWeaponType: WeaponTypeSource;
  readonly weaponType: OperatorWeaponType;
  readonly modelPath: string;
  readonly potentialSkillId: string;
  readonly skillIds: readonly string[];
}

export function parseWeaponBasicSources(
  value: unknown,
  weaponIds: readonly string[],
  sourceName = 'WeaponBasicTable',
): WeaponBasicSource[] {
  const table = requireRecord(value, sourceName);
  if (new Set(weaponIds).size !== weaponIds.length) {
    throw new Error('weaponIds: duplicate weapon ID');
  }

  return weaponIds.map(weaponId => {
    const sourcePath = `${sourceName}.${weaponId}`;
    const row = requireRecord(table[weaponId], sourcePath);
    requireExactFields(row, WEAPON_FIELDS, sourcePath);
    const embeddedId = requireNonEmptyString(row.weaponId, `${sourcePath}.weaponId`);
    if (embeddedId !== weaponId) {
      throw new Error(`${sourcePath}.weaponId: expected ${JSON.stringify(weaponId)}`);
    }

    requireArray(row.potentialUpItemList, `${sourcePath}.potentialUpItemList`);
    requireRecord(row.engName, `${sourcePath}.engName`);
    requireRecord(row.weaponDesc, `${sourcePath}.weaponDesc`);

    const nativeWeaponType = parseWeaponTypeValue(row.weaponType, `${sourcePath}.weaponType`);
    return {
      sourcePath,
      weaponId,
      levelTemplateId: requireNonEmptyString(row.levelTemplateId, `${sourcePath}.levelTemplateId`),
      breakthroughTemplateId: requireNonEmptyString(
        row.breakthroughTemplateId,
        `${sourcePath}.breakthroughTemplateId`,
      ),
      talentTemplateId: requireNonEmptyString(
        row.talentTemplateId,
        `${sourcePath}.talentTemplateId`,
      ),
      maximumLevel: requireNonNegativeInteger(row.maxLv, `${sourcePath}.maxLv`),
      rarity: requireNonNegativeInteger(row.rarity, `${sourcePath}.rarity`),
      nativeWeaponType,
      weaponType: projectWeaponType(nativeWeaponType, `${sourcePath}.weaponType`),
      modelPath: requireString(row.modelPath, `${sourcePath}.modelPath`),
      potentialSkillId: requireString(
        row.weaponPotentialSkill,
        `${sourcePath}.weaponPotentialSkill`,
      ),
      skillIds: requireArray(row.weaponSkillList, `${sourcePath}.weaponSkillList`).map(
        (rawSkillId, index) =>
          requireNonEmptyString(rawSkillId, `${sourcePath}.weaponSkillList[${index}]`),
      ),
    };
  });
}
