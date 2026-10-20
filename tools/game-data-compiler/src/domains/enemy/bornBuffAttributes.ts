import {
  ATTRIBUTE_TYPES,
  parseGameplayAttributeModifierSource,
} from '../../source/attributeModifiers.ts';
import { requireRecord } from '../../source/primitives.ts';
import { parseScalarSource } from '../../source/scalar.ts';

/** 第一阶段只读取原生 attributeModifier，不执行生命周期、事件或递归施加 Buff。 */
export function readEnemyBornBuffAttributes(
  value: unknown,
  path: string,
  overrides: Readonly<Record<string, number>> = {},
) {
  const root = requireRecord(value, path);
  const blackboard: Record<string, number> = {};
  if (Array.isArray(root.blackboard))
    for (const raw of root.blackboard) {
      const entry = requireRecord(raw, `${path}.blackboard`);
      if (
        entry.isDynamic === false &&
        typeof entry.key === 'string' &&
        typeof entry.valueDouble === 'number'
      )
        blackboard[entry.key] = entry.valueDouble;
    }
  Object.assign(blackboard, overrides);
  const source = parseGameplayAttributeModifierSource(
    root.attributeModifier,
    `${path}.attributeModifier`,
    {},
  );
  // 木桩不执行主动攻击或移动，这些属性不参与当前模型。
  const modifiers = source.modifiers.filter(
    modifier =>
      !['Atk', 'MoveSpeedScalar', 'InAirMoveSpeedScalar', 'TurnRateScalar', 'AttackRate'].includes(
        modifier.attributeType,
      ),
  );
  if (modifiers.length && root.lifeType !== 'Infinity') {
    const duration = parseScalarSource(root.duration, `${path}.duration`, {});
    if (
      root.lifeType !== 'Limited' ||
      duration.blackboardKey !== null ||
      duration.value >= -0.00001
    )
      throw new Error(`${path}: timed born attributes require runtime lifecycle`);
  }
  return modifiers.map(modifier => {
    if (source.isConvertedAttribute || modifier.modifyAttributeType !== 'Specific')
      throw new Error(`${path}: born attribute requires runtime conversion`);
    const key = modifier.parameter.blackboardKey;
    if (key !== null && !Number.isFinite(blackboard[key]))
      throw new Error(`${path}: born attribute requires blackboard evaluation`);
    return {
      attrType: ATTRIBUTE_TYPES.indexOf(modifier.attributeType),
      modifyAttributeType: 0,
      formulaItem: modifier.formulaItem,
      attrValue: key === null ? modifier.parameter.value : blackboard[key]!,
    };
  });
}
