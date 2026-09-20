import type { PassiveSkillCompileRequestSource } from '../../compiler/skills/passiveSkillRequest.ts';
import {
  requireArray,
  requireExactFields,
  requireNonEmptyString,
  requireRecord,
} from '../../source/primitives.ts';

const EQUIPMENT_SUIT_FIELDS = new Set(['equipList', 'list']);
const EQUIPMENT_SUIT_SKILL_FIELDS = new Set([
  'equipCnt',
  'skillID',
  'skillLv',
  'suitID',
  'suitLogoName',
  'suitName',
]);

/**
 * 装备套装只负责发现达到件数阈值时安装的被动技能。
 * 技能行为仍由公共 SkillData 编译器读取，领域层不手写套装效果。
 */
export function discoverEquipmentSuitPassiveSkillRequests(
  value: unknown,
  suitIds: readonly string[],
  sourceName = 'EquipSuitTable',
): PassiveSkillCompileRequestSource[] {
  const table = requireRecord(value, sourceName);
  const output: PassiveSkillCompileRequestSource[] = [];
  for (const suitId of suitIds) {
    const rowPath = `${sourceName}.${suitId}`;
    const row = requireRecord(table[suitId], rowPath);
    requireExactFields(row, EQUIPMENT_SUIT_FIELDS, rowPath);
    validateEquipmentIds(row.equipList, `${rowPath}.equipList`);

    requireArray(row.list, `${rowPath}.list`).forEach((rawThreshold, thresholdIndex) => {
      const thresholdPath = `${rowPath}.list[${thresholdIndex}]`;
      const threshold = requireRecord(rawThreshold, thresholdPath);
      requireExactFields(threshold, EQUIPMENT_SUIT_SKILL_FIELDS, thresholdPath);
      const embeddedSuitId = requireNonEmptyString(threshold.suitID, `${thresholdPath}.suitID`);
      if (embeddedSuitId !== suitId) {
        throw new Error(`${thresholdPath}.suitID: expected ${JSON.stringify(suitId)}`);
      }

      output.push({
        originKind: 'equipmentSuit',
        originId: suitId,
        sourcePath: thresholdPath,
        skillId: requireNonEmptyString(threshold.skillID, `${thresholdPath}.skillID`),
        levelSource: {
          kind: 'equipmentSuitThreshold',
          level: requirePositiveInteger(threshold.skillLv, `${thresholdPath}.skillLv`),
          requiredCount: requirePositiveInteger(threshold.equipCnt, `${thresholdPath}.equipCnt`),
        },
        inputBlackboard: {},
      });

      // 名称和图标只是展示证据，不进入战斗定义；仍严格确认导出形状没有漂移。
      requireNonEmptyString(threshold.suitLogoName, `${thresholdPath}.suitLogoName`);
      requireRecord(threshold.suitName, `${thresholdPath}.suitName`);
    });
  }
  return output;
}

function validateEquipmentIds(value: unknown, path: string): void {
  const ids = requireArray(value, path).map((item, index) =>
    requireNonEmptyString(item, `${path}[${index}]`),
  );
  if (new Set(ids).size !== ids.length) {
    throw new Error(`${path}: duplicate equipment ID`);
  }
}

function requirePositiveInteger(value: unknown, path: string): number {
  if (typeof value !== 'number' || !Number.isInteger(value) || value <= 0) {
    throw new Error(`${path}: expected a positive integer`);
  }
  return value;
}
