import { parseDeclaredBlackboard } from '../../source/blackboard.ts';
import {
  requireArray,
  requireBoolean,
  requireExactFields,
  requireNonEmptyString,
  requireNonNegativeInteger,
  requireRecord,
  type SourceRecord,
} from '../../source/primitives.ts';
import { collectSkillRootBuffReferences } from '../../source/referenceGraph.ts';
import type { SkillPatchSource } from '../../source/skillPatch.ts';
import {
  resolveSkillBlackboardSource,
  type ResolvedSkillBlackboardSource,
} from './skillBlackboard.ts';
import { parseKnownNativeActionSequenceSource } from '../../source/actionLeaf.ts';
import { parseTargetReferenceSource } from '../../source/target.ts';
import type { CompiledBuffSequenceSource } from '../actions/combatActionProjectionTypes.ts';
import type { SkillType } from '../../../../../packages/game-data-contract/src/primitives.ts';
import { parseBlackboardAssignmentsSource } from '../../source/assignments.ts';
import {
  projectBuffAssignments,
  projectStringBuffAssignments,
} from '../actions/combatActionLeafProjection.ts';
import { compileEventCondition } from '../conditions/combatConditionProjection.ts';
import type { CombatActionProjectionContextSource } from '../combatProjectionCommon.ts';
import type { CompiledBuffConditionSource } from '../actions/combatActionProjectionTypes.ts';

const SWITCH_SKILL_TYPES: Readonly<Record<string, SkillType>> = {
  Attack: 'basicAttack',
  NormalSkill: 'battleSkill',
  ComboSkill: 'comboSkill',
  UltimateSkill: 'ultimate',
};

/** 当前正式运行时只接收弭弗样本所代表的零费用 Owner→Owner 同步旁路。 */
export function compileStrictSwitchToBuffCastSource(
  value: unknown,
  sourcePath: string,
  context: CombatActionProjectionContextSource,
):
  | {
      readonly currentSkillTypes?: readonly SkillType[];
      readonly requiresCurrentSkillNotInterruptible?: boolean;
      readonly condition?: CompiledBuffConditionSource;
      readonly asSkillCast: boolean;
      readonly sequence: CompiledBuffSequenceSource;
    }
  | undefined {
  const root = requireRecord(value, sourcePath);
  const config = requireRecord(root.switchToBuffConfig, `${sourcePath}.switchToBuffConfig`);
  const conditionRaw = requireRecord(
    config.condition,
    `${sourcePath}.switchToBuffConfig.condition`,
  );
  const buffs = requireArray(config.buffs, `${sourcePath}.switchToBuffConfig.buffs`);
  // Unity 的默认序列化形态是空 condition 对象；只有真正启用旁路时才存在 actionData。
  // 先识别该哨兵，避免把所有普通主动技能都误判成损坏的 SwitchToAddBuff。
  if (conditionRaw.actionData === undefined) {
    if (buffs.length !== 0) throw new Error(`${sourcePath}: inactive switch route has Buff inputs`);
    return undefined;
  }
  const conditionActions = requireArray(
    conditionRaw.actionData,
    `${sourcePath}.switchToBuffConfig.condition.actionData`,
  );
  if (conditionActions.length === 0) {
    if (buffs.length !== 0) throw new Error(`${sourcePath}: inactive switch route has Buff inputs`);
    return undefined;
  }
  const parsed = parseKnownNativeActionSequenceSource(
    conditionRaw,
    `${sourcePath}.switchToBuffConfig.condition`,
    {},
  );
  const nodes = parsed.actions.filter(node => node.metadata.enabled);
  if (nodes.length === 0)
    throw new Error(`${sourcePath}: active SwitchToAddBuff has no conditions`);
  let currentSkillTypes: readonly SkillType[] | undefined;
  let requiresCurrentSkillNotInterruptible = false;
  const projectedConditions: CompiledBuffConditionSource[] = [];
  for (const node of nodes) {
    if (node.body.kind !== 'leaf' || node.body.value.family !== 'condition') {
      throw new Error(`${sourcePath}: unsupported SwitchToAddBuff condition`);
    }
    const nativeCondition = node.body.value.action;
    if (nativeCondition.kind === 'skillType' && nativeCondition.checkTargetCurrentSkill) {
      if (
        currentSkillTypes !== undefined ||
        nativeCondition.skillOwner?.targetSource !== 'Owner' ||
        nativeCondition.skillOwner.targetGroupKey !== ''
      ) {
        throw new Error(`${sourcePath}: unsupported SwitchToAddBuff current-skill condition`);
      }
      currentSkillTypes = mapSwitchSkillTypes(
        nativeCondition.skillTypes,
        nativeCondition.attackTypeMask,
        sourcePath,
      );
      if (currentSkillTypes.length === 0)
        throw new Error(`${sourcePath}: SwitchToAddBuff skill types must not be empty`);
      requiresCurrentSkillNotInterruptible = nativeCondition.mustBeforeExclusiveTime === true;
      continue;
    }
    const condition = compileEventCondition(node, context, new Map());
    if (condition === null) throw new Error(`${sourcePath}: unsupported SwitchToAddBuff condition`);
    projectedConditions.push(condition);
  }
  const projectedCondition =
    projectedConditions.length === 0
      ? undefined
      : projectedConditions.length === 1
        ? projectedConditions[0]
        : ({ kind: 'all', conditions: projectedConditions } as const);
  const buffSource = parseTargetReferenceSource(
    config.buffSource,
    `${sourcePath}.switchToBuffConfig.buffSource`,
  );
  const targets = parseTargetReferenceSource(
    config.targets,
    `${sourcePath}.switchToBuffConfig.targets`,
  );
  const targetSource = (selector: typeof buffSource): 'caster' => {
    // 公共目标解析器仅在 Context 来源读取 targetGroupKey；Source/Owner 上的陈旧键不改写身份。
    if (
      (selector.targetSource !== 'Source' && selector.targetSource !== 'Owner') ||
      selector.finderType !== null ||
      selector.validatorTypes.length !== 0 ||
      selector.postProcessorTypes.length !== 0
    )
      throw new Error(`${sourcePath}: unsupported SwitchToAddBuff target selector`);
    return 'caster';
  };
  targetSource(buffSource);
  const target = targetSource(targets);
  const asSkillCast = requireBoolean(
    config.asSkillCast,
    `${sourcePath}.switchToBuffConfig.asSkillCast`,
  );
  const steps = buffs.map((raw, index) => {
    const path = `${sourcePath}.switchToBuffConfig.buffs[${index}]`;
    const input = requireRecord(raw, path);
    requireExactFields(input, new Set(['buffId', 'assignBlackboard', 'assignItems']), path);
    const assignBlackboard = requireBoolean(input.assignBlackboard, `${path}.assignBlackboard`);
    const assignments = parseBlackboardAssignmentsSource(input.assignItems, `${path}.assignItems`, {
      enabled: assignBlackboard,
    });
    if (!assignBlackboard && assignments.length !== 0) {
      throw new Error(`${path}: disabled SwitchToAddBuff assignments are nonempty`);
    }
    const numericAssignments = assignBlackboard ? projectBuffAssignments(assignments, path) : {};
    const stringAssignments = assignBlackboard ? projectStringBuffAssignments(assignments) : {};
    return {
      kind: 'applyBuff' as const,
      parameters: {
        buffId: requireNonEmptyString(input.buffId, `${path}.buffId`),
        target,
        inheritSourceSkillCastInfo: true,
        ...(Object.keys(numericAssignments).length === 0
          ? {}
          : { blackboardAssignments: numericAssignments }),
        ...(Object.keys(stringAssignments).length === 0
          ? {}
          : { stringBlackboardAssignments: stringAssignments }),
      },
    };
  });
  if (steps.length === 0)
    throw new Error(`${sourcePath}: active SwitchToAddBuff has no Buff input`);
  return {
    ...(currentSkillTypes === undefined ? {} : { currentSkillTypes }),
    ...(requiresCurrentSkillNotInterruptible ? { requiresCurrentSkillNotInterruptible: true } : {}),
    ...(projectedCondition === undefined ? {} : { condition: projectedCondition }),
    asSkillCast,
    sequence: { steps },
  };
}

function mapSwitchSkillTypes(
  nativeSkillTypes: readonly string[],
  attackTypeMask: string | number | undefined,
  sourcePath: string,
): readonly SkillType[] {
  const output = new Set<SkillType>();
  for (const skillType of nativeSkillTypes) {
    if (skillType === 'ExtraActiveSkill') continue;
    if (skillType === 'Attack') {
      const bits = decodeSwitchAttackTypeMask(attackTypeMask, sourcePath);
      if ((bits & 1) !== 0) output.add('basicAttack');
      // PlungingAttackStart 只负责起跳；正式时间轴仅有可落轴的 End 技能。
      if ((bits & 4) !== 0) output.add('plungingAttack');
      continue;
    }
    const mapped = SWITCH_SKILL_TYPES[skillType];
    if (mapped === undefined)
      throw new Error(`${sourcePath}: unsupported SwitchToAddBuff skill type ${skillType}`);
    output.add(mapped);
  }
  return [...output];
}

function decodeSwitchAttackTypeMask(
  value: string | number | undefined,
  sourcePath: string,
): number {
  if (value === undefined || value === 'All') return 7;
  if (typeof value === 'number') return value & 7;
  let result = 0;
  for (const item of value.split(',').map(part => part.trim())) {
    if (item === '' || item === 'None') continue;
    if (item === 'NormalAttack') result |= 1;
    else if (item === 'PlungingAttackStart') result |= 2;
    else if (item === 'PlungingAttackEnd') result |= 4;
    else throw new Error(`${sourcePath}: unsupported SwitchToAddBuff attack mask ${value}`);
  }
  return result;
}

/** SkillData 各运行形态共用的严格输入；领域层不得重复实现 Patch 与声明黑板合并。 */
export interface PreparedSkillDefinitionInputSource {
  readonly root: SourceRecord;
  readonly blackboard: ResolvedSkillBlackboardSource;
}

export function prepareSkillDefinitionInputSource(
  value: unknown,
  sourcePath: string,
  patch: SkillPatchSource | null,
): PreparedSkillDefinitionInputSource {
  const root = requireRecord(value, sourcePath);
  const level = requireNonNegativeInteger(root.level, `${sourcePath}.level`);
  return {
    root,
    blackboard: resolveSkillBlackboardSource(
      parseDeclaredBlackboard(root, sourcePath),
      level,
      patch,
    ),
  };
}

/** 时间轴投影尚无根附加效果端口；必须显式拒绝，不能把动作图成功当成完整技能成功。 */
export function assertNoUnprojectedSkillRootEffects(value: unknown, sourcePath: string): void {
  if (
    collectSkillRootBuffReferences(value, sourcePath).some(
      reference => reference.state !== 'inactive' && reference.usage !== 'switch',
    )
  )
    throw new Error(`${sourcePath}: skill root Buff installation is not yet supported`);
  const root = requireRecord(value, sourcePath);
  const modifier = requireRecord(root.cardAttributeModifier, `${sourcePath}.cardAttributeModifier`);
  if (
    modifier.isConvertedAttribute !== false ||
    requireArray(
      modifier.attributeModifiers,
      `${sourcePath}.cardAttributeModifier.attributeModifiers`,
    ).length
  )
    throw new Error(`${sourcePath}: skill root attribute modifiers are not yet supported`);
}
