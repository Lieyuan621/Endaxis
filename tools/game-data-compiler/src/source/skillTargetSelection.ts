import { requireBoolean, requireRecord } from './primitives.ts';
import { parseVector3Source, type Vector3Source } from './spatial.ts';

const SELECT_STRATEGIES = [
  'SelectObject',
  'SelectPosition',
  'NoTarget',
  'SelectDirection',
  'SelectSmartObject',
] as const;
const SMART_STRATEGIES = [
  'SelectComboSkillTarget',
  'SelectComboSkillTrigger',
  'SelectByBuff',
  'SelectByTag',
  'SelectByBuffStackNum',
] as const;

export interface SkillTargetSelectionHeaderSource {
  readonly sourcePath: string;
  readonly selectStrategy: (typeof SELECT_STRATEGIES)[number];
  readonly smartTargetSelectStrategy: (typeof SMART_STRATEGIES)[number];
  readonly canDummyCast: boolean;
  readonly dummyPositionOffset: Vector3Source;
}

/**
 * SkillData 目标选择策略头；同版本 MemoryPack 数值与 AKEDB 命名枚举归一到同一身份。
 * 只表示已读取策略/虚拟位置配置，不表示 Buff/Tag/层数评分参数或 dummy 位置生成已支持。
 * 施法目标设置、当前主目标/锁定目标和 SkillSetting 范围属于运行输入，不能从这些字段补默认。
 */
export function parseSkillTargetSelectionHeaderSource(
  value: unknown,
  sourcePath: string,
): SkillTargetSelectionHeaderSource {
  const root = requireRecord(value, sourcePath);
  return {
    sourcePath,
    selectStrategy: parseEnum(
      root.selectStrategy,
      SELECT_STRATEGIES,
      `${sourcePath}.selectStrategy`,
    ),
    smartTargetSelectStrategy: parseEnum(
      root.smartTargetSelectStrategy,
      SMART_STRATEGIES,
      `${sourcePath}.smartTargetSelectStrategy`,
    ),
    canDummyCast: requireBoolean(root.canDummyCast, `${sourcePath}.canDummyCast`),
    dummyPositionOffset: parseVector3Source(
      root.dummyPositionOffset,
      `${sourcePath}.dummyPositionOffset`,
    ),
  };
}

function parseEnum<T extends string>(value: unknown, names: readonly T[], path: string): T {
  if (typeof value === 'string' && names.includes(value as T)) return value as T;
  if (typeof value === 'number' && Number.isInteger(value) && value >= 0 && value < names.length)
    return names[value]!;
  throw new Error(`${path}: unknown native target selection ${JSON.stringify(value)}`);
}
