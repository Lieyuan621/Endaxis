import {
  requireArray,
  requireBoolean,
  requireExactFields,
  requireNonEmptyString,
  requireNonNegativeInteger,
  requireRecord,
  requireString,
} from '../../source/primitives.ts';

export interface WeaponSkillLevelBoundSource {
  readonly lowerBound: number;
  readonly upperBound: number;
}

export interface WeaponBreakthroughSkillLevelsSource {
  readonly breakthroughLevel: number;
  readonly skillLevelBounds: readonly WeaponSkillLevelBoundSource[];
}

export interface WeaponPotentialSkillLevelsSource {
  readonly potentialLevel: number;
  readonly skillLevelExtraBounds: readonly WeaponSkillLevelBoundSource[];
}

export interface WeaponGemTermSource {
  readonly termId: string;
  readonly cost: number;
}

export interface WeaponGemTermDefinitionSource {
  readonly termId: string;
  readonly tagId: string;
}

export interface ResolvedWeaponSkillLevelSource {
  readonly skillId: string;
  readonly level: number;
  readonly maxLevel: number;
}

/** 读取一个武器突破模板；技能槽边界顺序必须与 WeaponBasicTable.weaponSkillList 对齐。 */
export function parseWeaponBreakthroughSkillLevels(
  value: unknown,
  templateId: string,
  sourceName = 'WeaponBreakThroughTemplateTable',
): WeaponBreakthroughSkillLevelsSource[] {
  const table = requireRecord(value, sourceName);
  const rowPath = `${sourceName}.${templateId}`;
  const row = requireRecord(table[templateId], rowPath);
  requireExactFields(row, new Set(['list']), rowPath);
  return requireArray(row.list, `${rowPath}.list`).map((rawLevel, index) => {
    const path = `${rowPath}.list[${index}]`;
    const level = requireRecord(rawLevel, path);
    requireExactFields(
      level,
      new Set([
        'breakItemList',
        'breakthroughGold',
        'breakthroughLv',
        'breakthroughShowLv',
        'skillLevelBounds',
      ]),
      path,
    );
    validateBreakItems(level.breakItemList, `${path}.breakItemList`);
    requireNonNegativeInteger(level.breakthroughGold, `${path}.breakthroughGold`);
    requireNonNegativeInteger(level.breakthroughShowLv, `${path}.breakthroughShowLv`);
    return {
      breakthroughLevel: requireNonNegativeInteger(level.breakthroughLv, `${path}.breakthroughLv`),
      skillLevelBounds: parseLevelBounds(level.skillLevelBounds, `${path}.skillLevelBounds`),
    };
  });
}

/** 读取武器潜能模板；这里保留原生字段 talentLv 的身份，不把它改称星级。 */
export function parseWeaponPotentialSkillLevels(
  value: unknown,
  templateId: string,
  sourceName = 'WeaponTalentTemplateTable',
): WeaponPotentialSkillLevelsSource[] {
  const table = requireRecord(value, sourceName);
  const rowPath = `${sourceName}.${templateId}`;
  const row = requireRecord(table[templateId], rowPath);
  requireExactFields(row, new Set(['list']), rowPath);
  return requireArray(row.list, `${rowPath}.list`).map((rawLevel, index) => {
    const path = `${rowPath}.list[${index}]`;
    const level = requireRecord(rawLevel, path);
    requireExactFields(level, new Set(['skillLevelExtraBounds', 'talentLv']), path);
    return {
      potentialLevel: requireNonNegativeInteger(level.talentLv, `${path}.talentLv`),
      skillLevelExtraBounds: parseLevelBounds(
        level.skillLevelExtraBounds,
        `${path}.skillLevelExtraBounds`,
      ),
    };
  });
}

/** GemTable 只提供 termId 到 tagId 的身份映射；基质实例上的 cost 由构筑输入提供。 */
export function parseWeaponGemTermDefinitions(
  value: unknown,
  termIds: readonly string[],
  sourceName = 'GemTable',
): Readonly<Record<string, WeaponGemTermDefinitionSource>> {
  const table = requireRecord(value, sourceName);
  return Object.fromEntries(
    termIds.map(termId => {
      const path = `${sourceName}.${termId}`;
      const row = requireRecord(table[termId], path);
      requireExactFields(
        row,
        new Set([
          'gemTermId',
          'isSkillTerm',
          'sortOrder',
          'tagDesc',
          'tagIcon',
          'tagId',
          'tagName',
          'termType',
        ]),
        path,
      );
      const embeddedId = requireNonEmptyString(row.gemTermId, `${path}.gemTermId`);
      if (embeddedId !== termId) {
        throw new Error(`${path}.gemTermId: expected ${JSON.stringify(termId)}`);
      }
      requireBoolean(row.isSkillTerm, `${path}.isSkillTerm`);
      requireNonNegativeInteger(row.sortOrder, `${path}.sortOrder`);
      requireRecord(row.tagDesc, `${path}.tagDesc`);
      requireString(row.tagIcon, `${path}.tagIcon`);
      requireRecord(row.tagName, `${path}.tagName`);
      requireNonNegativeInteger(row.termType, `${path}.termType`);
      return [
        termId,
        {
          termId,
          tagId: requireNonEmptyString(row.tagId, `${path}.tagId`),
        },
      ];
    }),
  );
}

/**
 * 读取每个武器技能一级补丁的 tagId。原生基质算法只使用一级补丁；缺少一级项时不建立映射。
 */
export function parseWeaponSkillLevelOneTags(
  value: unknown,
  skillIds: readonly string[],
  sourceName = 'SkillPatchTable',
): Readonly<Record<string, string>> {
  const table = requireRecord(value, sourceName);
  const output: Record<string, string> = {};
  for (const skillId of skillIds) {
    if (!(skillId in table)) continue;
    const path = `${sourceName}.${skillId}`;
    const row = requireRecord(table[skillId], path);
    const bundles = requireArray(row.SkillPatchDataBundle, `${path}.SkillPatchDataBundle`);
    for (let index = 0; index < bundles.length; index++) {
      const bundlePath = `${path}.SkillPatchDataBundle[${index}]`;
      const bundle = requireRecord(bundles[index], bundlePath);
      const embeddedId = requireNonEmptyString(bundle.skillId, `${bundlePath}.skillId`);
      if (embeddedId !== skillId) {
        throw new Error(`${bundlePath}.skillId: expected ${JSON.stringify(skillId)}`);
      }
      const level = requireNonNegativeInteger(bundle.level, `${bundlePath}.level`);
      const tagId = requireString(bundle.tagId, `${bundlePath}.tagId`);
      if (level === 1 && !(skillId in output)) output[skillId] = tagId;
    }
  }
  return output;
}

/** 严格复现原生非 iFix 路径的武器技能等级算法。 */
export function resolveWeaponSkillLevels(
  skillIds: readonly string[],
  breakthroughLevel: number,
  breakthroughRows: readonly WeaponBreakthroughSkillLevelsSource[],
  potentialLevel: number,
  potentialRows: readonly WeaponPotentialSkillLevelsSource[],
  gemTerms: readonly WeaponGemTermSource[],
  gemTermDefinitions: Readonly<Record<string, WeaponGemTermDefinitionSource>>,
  skillLevelOneTags: Readonly<Record<string, string>>,
): ResolvedWeaponSkillLevelSource[] {
  const breakthrough = breakthroughRows.find(row => row.breakthroughLevel === breakthroughLevel);
  if (!breakthrough) return [];
  requireEnoughBounds(skillIds.length, breakthrough.skillLevelBounds.length, 'breakthroughRows');

  const levels = skillIds.map((skillId, index) => ({
    skillId,
    level: breakthrough.skillLevelBounds[index]!.lowerBound,
    maxLevel: breakthrough.skillLevelBounds[index]!.upperBound,
  }));
  const potential = potentialRows.find(row => row.potentialLevel === potentialLevel);
  if (potential) {
    requireEnoughBounds(levels.length, potential.skillLevelExtraBounds.length, 'potentialRows');
    levels.forEach((level, index) => {
      const extra = potential.skillLevelExtraBounds[index]!;
      level.maxLevel += extra.upperBound;
      level.level = Math.min(level.level + extra.lowerBound, level.maxLevel);
    });
  }

  for (const level of levels) {
    const skillTag = skillLevelOneTags[level.skillId];
    if (skillTag === undefined) continue;
    for (const gemTerm of gemTerms) {
      const definition = gemTermDefinitions[gemTerm.termId];
      if (!definition || definition.tagId !== skillTag) continue;
      level.level = Math.min(level.level + gemTerm.cost, level.maxLevel);
    }
  }
  return levels;
}

function parseLevelBounds(value: unknown, path: string): WeaponSkillLevelBoundSource[] {
  return requireArray(value, path).map((rawBound, index) => {
    const boundPath = `${path}[${index}]`;
    const bound = requireRecord(rawBound, boundPath);
    requireExactFields(bound, new Set(['lowerBound', 'upperBound']), boundPath);
    return {
      lowerBound: requireNonNegativeInteger(bound.lowerBound, `${boundPath}.lowerBound`),
      upperBound: requireNonNegativeInteger(bound.upperBound, `${boundPath}.upperBound`),
    };
  });
}

function validateBreakItems(value: unknown, path: string): void {
  requireArray(value, path).forEach((rawItem, index) => {
    const itemPath = `${path}[${index}]`;
    const item = requireRecord(rawItem, itemPath);
    requireExactFields(item, new Set(['count', 'id']), itemPath);
    requireNonNegativeInteger(item.count, `${itemPath}.count`);
    requireNonEmptyString(item.id, `${itemPath}.id`);
  });
}

function requireEnoughBounds(required: number, actual: number, source: string): void {
  if (actual < required) {
    throw new Error(
      `${source}: expected at least ${required} weapon skill bounds, found ${actual}`,
    );
  }
}
