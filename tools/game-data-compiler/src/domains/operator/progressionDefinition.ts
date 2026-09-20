import { isDeepStrictEqual } from 'node:util';
import {
  OPERATOR_ATTRIBUTES,
  UPGRADE_STATIC_DAMAGE_INCREASE_TARGETS,
  type CombatResource,
  type ActionSequenceDefinition,
  type OperatorUpgradeDefinition,
  type UpgradeModifierDefinition,
} from '../../../../../packages/game-data-contract/src/index.ts';
import { projectBuildAttributeModifier } from '../../compiler/build/buildAttributeProjection.ts';
import { projectSingleBuildConditionSource } from '../../compiler/conditions/buildCondition.ts';
import type { OperatorProgressionSource } from './progression.ts';
import type { CompiledOperatorProgressionEntrySource } from './progressionEffects.ts';
import type { OperatorSkillGroupSource, OperatorSkillIdentitySource } from './skillGroups.ts';

/** 来自已校验技能库及技能消耗元数据的绑定；不靠原生 ID 后缀选择技能组或消耗类型。 */
export interface OperatorProgressionDefinitionContext {
  readonly skills: readonly OperatorSkillIdentitySource[];
  readonly skillGroups: readonly OperatorSkillGroupSource[];
  readonly costResources: ReadonlyMap<string, CombatResource>;
  /** 已由公共被动编译器完整装配的 AddPassiveSkill 来源；未列出的条目仍严格失败。 */
  readonly installedPassiveSkillSourcePaths?: ReadonlySet<string>;
  /** 当前整名候选已安装的被动技能身份，供潜能黑板修正绑定。 */
  readonly passiveSkillKeys?: ReadonlySet<string>;
  /** 被动通过 OnCollectOutputBuffBbValue 投影为反应修正时，黑板补丁继续绑定同一语义。 */
  readonly reactionPassiveInputs?: ReadonlyMap<
    string,
    { readonly durationKey: string; readonly effectivenessKey: string }
  >;
  /** 注册但不属于玩家可直接养成/放置入口的替换技能。 */
  readonly runtimeReplacementSkillKeys?: ReadonlySet<string>;
}

type Progression = Pick<
  OperatorProgressionSource,
  'talentNodes' | 'potential' | 'compiledEffectBundles'
>;

/** 天赋每次只启用所选等级；按原生 index/level 聚合，禁止按节点名或数组出现顺序猜级别。 */
export function compileOperatorTalentDefinition(
  source: Progression,
  binding: { readonly index: number },
  context: OperatorProgressionDefinitionContext,
): OperatorUpgradeDefinition {
  const nodes = source.talentNodes
    .filter(node => node.nodeType === 'passiveSkill' && node.passiveSkill.index === binding.index)
    .sort((left, right) => left.passiveSkill.level - right.passiveSkill.level);
  if (!nodes.length) throw new Error(`missing passive talent index ${binding.index}`);
  nodes.forEach((node, index) => {
    if (node.passiveSkill.level !== index + 1)
      throw new Error(`${node.sourcePath}: talent levels must be unique and contiguous from 1`);
  });
  return assembleUpgrade(
    `talent[${binding.index}]`,
    nodes.map(node => node.talentEffectId),
    source,
    context,
  );
}

/** 每档潜能生成一个独立启用项；累计启用由正式构筑层处理，不能在这里重复累加前档。 */
export function compileOperatorPotentialDefinition(
  source: Progression,
  binding: { readonly level: number },
  context: OperatorProgressionDefinitionContext,
): OperatorUpgradeDefinition {
  const unlocks = source.potential.unlocks.filter(unlock => unlock.level === binding.level);
  if (unlocks.length !== 1)
    throw new Error(`expected one potential unlock at level ${binding.level}`);
  return assembleUpgrade(
    `potential[${binding.level - 1}]`,
    [unlocks[0]!.effectId],
    source,
    context,
  );
}

function assembleUpgrade(
  key: string,
  effectIds: readonly string[],
  source: Progression,
  context: OperatorProgressionDefinitionContext,
): OperatorUpgradeDefinition {
  const levels = effectIds.map(effectId => {
    const matches = source.compiledEffectBundles.filter(bundle => bundle.effectId === effectId);
    if (matches.length !== 1) throw new Error(`${key}: expected one effect bundle '${effectId}'`);
    return matches[0]!;
  });
  // 所有等级先完整编译。任何未支持条目都使整个养成项失败，绝不输出“缺一半”的天赋。
  const modifiersByLevel = levels.map(bundle =>
    bundle.entries.flatMap(entry => (entry.kind === 'buff' ? [] : compileModifier(entry, context))),
  );
  const initializations = levels.map(
    bundle =>
      ({
        steps: bundle.entries.flatMap(entry => {
          if (entry.kind !== 'buff') return [];
          if (entry.activeCondition !== null)
            throw new Error(
              `${entry.sourcePath}: attached Buff has an unrepresentable build condition`,
            );
          // CharMiscFeature.Start → RefreshTalentBuff/RefreshPotentialBuff：角色直接给自身加 Buff，
          // 不是 AddPassiveSkill。初始黑板只来自 attachBuff，不继承某次技能的施放信息。
          return [
            {
              kind: 'applyBuff' as const,
              parameters: {
                buffId: entry.buffId,
                target: 'caster' as const,
                inheritSourceSkillCastInfo: false,
                ...(Object.keys(entry.inputBlackboard).length
                  ? {
                      blackboardAssignments: Object.fromEntries(
                        Object.entries(entry.inputBlackboard).map(([key, value]) => [
                          key,
                          { kind: 'constant' as const, value },
                        ]),
                      ),
                    }
                  : {}),
              },
            },
          ];
        }),
      }) satisfies ActionSequenceDefinition,
  );
  const initializationSequence = mergeInitializationSequences(key, initializations);
  const first = modifiersByLevel[0]!;
  if (modifiersByLevel.some(modifiers => modifiers.length !== first.length))
    throw new Error(`${key}: level-dependent effect structure is not representable`);
  const modifiers: UpgradeModifierDefinition[] = first.flatMap<UpgradeModifierDefinition>(
    (modifier, index) => {
      const variants = modifiersByLevel.map(items => items[index]!);
      if (modifier.kind === 'patchSkillBlackboard') {
        const { value: _value, ...shape } = modifier;
        const values = variants.map((variant, levelIndex) => {
          if (variant.kind !== 'patchSkillBlackboard')
            throw new Error(`${levels[levelIndex]!.sourcePath}: level-dependent modifier kind`);
          const { value, ...otherShape } = variant;
          if (typeof value !== 'number')
            throw new Error(
              `${levels[levelIndex]!.sourcePath}: level-dependent modifier structure`,
            );
          return { value, shape: otherShape };
        });
        if (values.every(item => isDeepStrictEqual(shape, item.shape))) {
          const levelValues = values.map(item => item.value);
          return [{ ...modifier, value: levelValues.length === 1 ? levelValues[0]! : levelValues }];
        }
        const { blackboardKey: _blackboardKey, ...shapeWithoutKey } = shape;
        const keyed = values.map(({ value, shape: variantShape }, levelIndex) => {
          const { blackboardKey, ...variantWithoutKey } = variantShape;
          if (
            !isDeepStrictEqual(shapeWithoutKey, variantWithoutKey) ||
            value !== values[0]!.value ||
            variants.some(
              (other, otherIndex) =>
                otherIndex !== levelIndex &&
                other.kind === 'patchSkillBlackboard' &&
                other.blackboardKey === blackboardKey,
            )
          ) {
            throw new Error(
              `${levels[levelIndex]!.sourcePath}: level-dependent modifier structure`,
            );
          }
          return {
            ...modifier,
            blackboardKey,
            value,
            minimumUpgradeLevel: levelIndex + 1,
            maximumUpgradeLevel: levelIndex + 1,
          };
        });
        return keyed;
      }
      if (variants.some(variant => !isDeepStrictEqual(modifier, variant)))
        throw new Error(`${key}: ${modifier.kind} cannot represent level-dependent values`);
      return [modifier];
    },
  );
  return {
    levels: levels.length,
    ...(modifiers.length ? { modifiers } : {}),
    ...(initializationSequence.steps.length ? { initializationSequence } : {}),
  };
}

/** 同一养成项的各级直接附着 Buff 必须同构；仅数值黑板输入可按等级变化。 */
function mergeInitializationSequences(
  key: string,
  sequences: readonly ActionSequenceDefinition[],
): ActionSequenceDefinition {
  const first = sequences[0]!;
  if (sequences.every(sequence => isDeepStrictEqual(sequence, first))) return first;
  if (sequences.some(sequence => sequence.steps.length !== first.steps.length))
    throw new Error(`${key}: level-dependent attached Buff initialization structure`);
  return {
    steps: first.steps.map((step, stepIndex) => {
      const variants = sequences.map(sequence => sequence.steps[stepIndex]!);
      if (step.kind !== 'applyBuff' || variants.some(variant => variant.kind !== 'applyBuff'))
        throw new Error(`${key}: level-dependent attached Buff initialization structure`);
      const { blackboardAssignments: firstAssignments = {}, ...firstParameters } = step.parameters;
      const assignments = variants.map(variant =>
        variant.kind === 'applyBuff' ? (variant.parameters.blackboardAssignments ?? {}) : {},
      );
      if (
        variants.some(variant => {
          if (variant.kind !== 'applyBuff') return true;
          const { blackboardAssignments: _assignments, ...parameters } = variant.parameters;
          return !isDeepStrictEqual(parameters, firstParameters);
        }) ||
        assignments.some(
          value => !isDeepStrictEqual(Object.keys(value), Object.keys(firstAssignments)),
        )
      )
        throw new Error(`${key}: level-dependent attached Buff initialization structure`);
      const mergedAssignments = Object.fromEntries(
        Object.keys(firstAssignments).map(blackboardKey => {
          const values = assignments.map(value => {
            const operand = value[blackboardKey];
            if (
              operand === undefined ||
              typeof operand !== 'object' ||
              !('kind' in operand) ||
              operand.kind !== 'constant'
            )
              throw new Error(`${key}: level-dependent attached Buff initialization operand`);
            return operand.value;
          });
          return [
            blackboardKey,
            values.every(value => value === values[0])
              ? { kind: 'constant' as const, value: values[0]! }
              : values,
          ];
        }),
      );
      return {
        ...step,
        parameters: {
          ...firstParameters,
          ...(Object.keys(mergedAssignments).length
            ? { blackboardAssignments: mergedAssignments }
            : {}),
        },
      };
    }),
  };
}

function compileModifier(
  entry: Exclude<CompiledOperatorProgressionEntrySource, { kind: 'buff' }>,
  context: OperatorProgressionDefinitionContext,
): UpgradeModifierDefinition[] {
  if (entry.kind === 'none') return [];
  const fail = (reason: string): never => {
    throw new Error(`${entry.sourcePath}: ${reason}`);
  };
  if (entry.kind === 'skillBlackboardModifier') {
    const reactionInput = context.reactionPassiveInputs?.get(entry.skillId);
    if (reactionInput !== undefined) {
      if (entry.stringValue !== '' || entry.activeCondition !== null || entry.operation !== 'add')
        fail('collected Buff reaction modifier only supports unconditional numeric addition');
      if (entry.blackboardKey === reactionInput.durationKey) {
        return [{ kind: 'addReactionDuration', reaction: 'corrosion', seconds: entry.numberValue }];
      }
      if (entry.blackboardKey === reactionInput.effectivenessKey) {
        return [
          { kind: 'addReactionEffectiveness', reaction: 'corrosion', value: entry.numberValue },
        ];
      }
      fail(`unknown collected Buff reaction input ${JSON.stringify(entry.blackboardKey)}`);
    }
    if (context.passiveSkillKeys?.has(entry.skillId)) {
      if (entry.stringValue !== '') fail('string passive blackboard modifier is not supported');
      if (entry.activeCondition !== null)
        fail('passive blackboard modifier has an unrepresentable build condition');
      return [
        {
          kind: 'patchPassiveBlackboard',
          passiveSkillKey: entry.skillId,
          blackboardKey: entry.blackboardKey,
          operation: entry.operation === 'overwrite' ? 'assign' : entry.operation,
          value: entry.numberValue,
        },
      ];
    }
    if (entry.stringValue !== '') fail('string skill blackboard modifier is not supported');
    const target = resolveSkill(entry.skillId, context, entry.sourcePath);
    const condition = projectSingleBuildConditionSource(entry.activeCondition, entry.sourcePath);
    return [
      {
        kind: 'patchSkillBlackboard',
        skillGroupKey: target.group.key,
        ...(target.singleSkill ? {} : { skillKey: target.skill.key }),
        blackboardKey: entry.blackboardKey,
        operation: entry.operation === 'overwrite' ? 'assign' : entry.operation,
        value: entry.numberValue,
        ...(condition === null ? {} : { condition }),
      },
    ];
  }
  if (entry.kind === 'passiveSkill') {
    if (context.installedPassiveSkillSourcePaths?.has(entry.sourcePath)) return [];
    return fail(
      `AddPassiveSkill '${entry.skillId}' must be assembled through the shared passive compiler`,
    );
  }
  if (entry.kind === 'skillParameterModifier') {
    const target = resolveSkill(entry.skillId, context, entry.sourcePath);
    const condition = projectSingleBuildConditionSource(entry.activeCondition, entry.sourcePath);
    if (entry.parameter === 'cooldown' && entry.operation === 'add') {
      const frames = entry.value * 30;
      if (!Number.isInteger(frames))
        return fail(`cooldown delta ${entry.value} seconds is not frame-exact`);
      return [
        {
          kind: 'addSkillCooldownFrames',
          skillGroupKey: target.group.key,
          ...(target.singleSkill ? {} : { skillKey: target.skill.key }),
          frames,
          ...(condition === null ? {} : { condition }),
        },
      ];
    }
    // CoolDownDisplay 只进入界面展示冷却调用链；不能把它当作第二次
    // 运行时冷却修正。Next 当前没有单独的构筑后冷却文案协议，因此明确略过该展示项。
    if (entry.parameter === 'cooldownDisplay' && entry.operation === 'add') return [];
    if (condition !== null) fail('skill cost modifier has an unrepresentable build condition');
    const resource = context.costResources.get(entry.skillId);
    if (entry.parameter !== 'costValue' || entry.operation !== 'multiply' || !resource)
      return fail('only an explicitly bound multiplicative skill cost is supported');
    return [
      {
        kind: 'multiplySkillCost',
        skillGroupKey: target.group.key,
        ...(target.singleSkill ? {} : { skillKey: target.skill.key }),
        resource,
        multiplier: entry.value,
      },
    ];
  }
  // 这些正式修正器还没有条件字段，不能把条件效果变成无条件效果。
  if (entry.activeCondition !== null) fail(`${entry.kind} has an unrepresentable build condition`);
  if (entry.kind === 'attributeModifier') {
    // 共享的原生属性/公式槽解释只在公共投影层维护；领域层只选择正式养成协议。
    const projection = projectBuildAttributeModifier(entry.modifier);
    if (projection.status === 'scenario-omitted') return [];
    if (projection.status !== 'supported') return fail(projection.reason);
    const modifier = projection.modifier;
    if (modifier.kind === 'attribute' && modifier.operation === 'flat') {
      const attribute = OPERATOR_ATTRIBUTES.find(value => value === modifier.attribute);
      if (attribute)
        return [{ kind: 'addBuildAttribute', attributes: [attribute], value: modifier.value }];
    }
    if (modifier.kind === 'panelStat') {
      const mapped = (() => {
        switch (modifier.stat) {
          case 'baseDefense':
            return { stat: 'defense', operation: 'flat' } as const;
          case 'healthFlat':
            return { stat: 'health', operation: 'flat' } as const;
          case 'healthPercent':
            return { stat: 'health', operation: 'percent' } as const;
          case 'criticalRate':
            return { stat: 'criticalRate', operation: 'flat' } as const;
          case 'artsIntensity':
            return { stat: 'artsIntensity', operation: 'flat' } as const;
          default:
            return undefined;
        }
      })();
      if (mapped) return [{ kind: 'modifyBasePanelStat', ...mapped, value: modifier.value }];
    }
    if (modifier.kind === 'damageScale' && modifier.slot === 'baseAddition') {
      const target = UPGRADE_STATIC_DAMAGE_INCREASE_TARGETS.find(
        value => value === modifier.target,
      );
      if (target) return [{ kind: 'addStaticDamageIncrease', target, value: modifier.value }];
    }
    if (modifier.kind === 'staticHealingIncrease') {
      return [
        {
          kind: 'addStaticHealingIncrease',
          target: modifier.target,
          value: modifier.value,
        },
      ];
    }
    return fail(`projected ${modifier.kind} is not yet representable as an upgrade modifier`);
  }
  return fail('unsupported progression effect');
}

function resolveSkill(
  skillId: string,
  context: OperatorProgressionDefinitionContext,
  path: string,
) {
  const skills = context.skills.filter(skill => skill.key === skillId);
  if (skills.length !== 1) throw new Error(`${path}: expected one skill binding for '${skillId}'`);
  const skill = skills[0]!;
  const groups = context.skillGroups.filter(
    group =>
      group.skillKeys.includes(skill.key) ||
      group.variants.some(variant => variant.skillKeys.includes(skill.key)),
  );
  if (groups.length !== 1) throw new Error(`${path}: expected one group binding for '${skillId}'`);
  const group = groups[0]!;
  const visibleSkillKeys = group.skillKeys.filter(
    key => !context.runtimeReplacementSkillKeys?.has(key),
  );
  const hasRuntimeReplacements = group.skillKeys.some(key =>
    context.runtimeReplacementSkillKeys?.has(key),
  );
  return {
    skill,
    group,
    singleSkill:
      visibleSkillKeys.length === 1 &&
      group.variants.length === 0 &&
      !hasRuntimeReplacements &&
      !context.runtimeReplacementSkillKeys?.has(skill.key),
  };
}
