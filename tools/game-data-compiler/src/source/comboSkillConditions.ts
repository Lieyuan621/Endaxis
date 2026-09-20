import {
  parseKnownNativeActionSequenceSource,
  type KnownNativeActionLeafSource,
} from './actionLeaf.ts';
import type { NativeSequenceSource } from './controlFlow.ts';
import {
  requireArray,
  requireBoolean,
  requireExactFields,
  requireInteger,
  requireRecord,
} from './primitives.ts';
import type { BlackboardLevelValues } from './scalar.ts';

export interface ComboSkillConditionSource {
  readonly sourcePath: string;
  readonly nativeEvent: number;
  readonly immediately: boolean;
  readonly sequence: NativeSequenceSource<KnownNativeActionLeafSource>;
}

/**
 * 读取 SkillDataBundle.comboSkillConditions；这里的动作必须已经展开为公共原生序列格式。
 * 原始 Unity RID、priority 枚举整数等仍须由来源适配器规范化，不猜引用内容或缺失字段。
 */
export function parseComboSkillConditionsSource(
  value: unknown,
  sourcePath: string,
  inheritedBlackboard: BlackboardLevelValues,
): readonly ComboSkillConditionSource[] {
  return requireArray(value, sourcePath).map((value, index) => {
    const path = `${sourcePath}[${index}]`;
    const record = requireRecord(value, path);
    requireExactFields(
      record,
      new Set(['comboSkillEvent', 'comboSkillConditionImmediately', 'comboSkillCheckAction']),
      path,
    );
    return {
      sourcePath: path,
      nativeEvent: requireInteger(record.comboSkillEvent, `${path}.comboSkillEvent`),
      immediately: requireBoolean(
        record.comboSkillConditionImmediately,
        `${path}.comboSkillConditionImmediately`,
      ),
      sequence: parseKnownNativeActionSequenceSource(
        record.comboSkillCheckAction,
        `${path}.comboSkillCheckAction`,
        inheritedBlackboard,
      ),
    };
  });
}
