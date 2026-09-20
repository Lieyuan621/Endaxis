import type { DamageActionSource } from '../../source/damageActions.ts';
import type { ScalarSource } from '../../source/scalar.ts';
import type { TargetReferenceSource } from '../../source/target.ts';
import { projectNativeDamageElement } from '../../source/damageElement.ts';
import type { DamageModifierSide } from '../../../../../packages/game-data-contract/src/modifiers.ts';
import {
  compileResolvedAttributeModifierSource,
  projectCombatRuntimeAttributeKey,
} from '../build/attributeModifier.ts';
import {
  projectGameplayTags,
  type CombatActionProjectionContextSource,
} from '../combatProjectionCommon.ts';

import type {
  CompiledActionValueOperandSource,
  CompiledSimplePoiseOperationSource,
  CompiledSimpleDamageOperationSource,
} from './combatActionProjectionTypes.ts';
export type {
  CompiledActionValueOperandSource,
  CompiledSimplePoiseOperationSource,
  CompiledSimpleDamageOperationSource,
} from './combatActionProjectionTypes.ts';

/**
 * 投影固定单敌人场景中的标准攻击倍率伤害（Hp 后接可选的固定 Poise 单元）。
 * simpleCalculation 读取顶层 atkScale；普通 AtkScaleCalculation 读取嵌套倍率。
 * 两者都在执行时读黑板，不能在转换时冻结潜能等动作写入。处决的 BreakingAttackCalculation
 * 额外保留逐命中 multiplier；动态 multiplier 仍严格拒绝。
 */
export function compileEventTargetSimpleDamageOperationSource(
  action: DamageActionSource,
  sourcePath: string,
  context: Pick<
    CombatActionProjectionContextSource,
    'gameplayTagRegistry' | 'abilityEntityQueries'
  > & {
    readonly actionOwnerTarget: 'buffOwner' | 'caster' | 'unavailable';
    readonly actionSourceTarget: 'caster';
    readonly fixedBuffOwnerTarget?: 'caster' | 'enemy' | 'currentAbilityEntity';
    readonly staticEnemyTargetGroupKeys?: ReadonlySet<string>;
  } = { actionOwnerTarget: 'caster', actionSourceTarget: 'caster' },
): CompiledSimpleDamageOperationSource {
  requireDamageCasterOwner(action, context, sourcePath);
  const attackerTarget =
    action.attacker === 'ActionOwner'
      ? ('caster' as const)
      : action.attacker === 'ActionSource'
        ? context.actionSourceTarget
        : null;
  if (attackerTarget !== 'caster') {
    throw new Error(`${sourcePath}: unsupported simple damage action control flags`);
  }
  // alwaysNext=false 只在原生伤害应用失败时截断后续序列。这里的目标已经严格证明为唯一、
  // 存活且可受击的固定木桩，Endaxis 也不建模伤害免疫失败，因此两种取值的可见结果相同。
  // GetTargetsView 仅在 InstantSearch 执行 selectorData。
  // Context 读取已保存的组；残留选择器仍由来源层解析，但不能变成这次伤害的过滤条件。
  if (action.target.targetSource === 'Context') {
    if (
      !action.target.targetGroupKey ||
      !context.staticEnemyTargetGroupKeys?.has(action.target.targetGroupKey)
    )
      throw new Error(`${sourcePath}.target: unsupported simple event damage target`);
  } else if (action.target.targetSource === 'Owner' && context.fixedBuffOwnerTarget === 'enemy') {
    requireFixedTarget(action.target, 'Owner', `${sourcePath}.target`);
  } else {
    requireFixedTarget(action.target, 'Target', `${sourcePath}.target`);
  }
  // 原生 DamageAction 中 effectSource 只决定表现归属，
  // 不参与 attacker、倍率或目标结算。投射物回调的 Owner 因而无需冒充施术干员；
  // Context 分支只读取前序保存的表现锚点，同样不执行残留 selectorData。
  if (
    action.effectSource.targetSource === 'Owner' ||
    action.effectSource.targetSource === 'Source'
  ) {
    requireFixedTarget(
      action.effectSource,
      action.effectSource.targetSource,
      `${sourcePath}.effectSource`,
    );
  } else if (
    action.effectSource.targetSource !== 'Context' ||
    action.effectSource.targetGroupKey === ''
  ) {
    throw new Error(`${sourcePath}.effectSource: unsupported simple event damage source`);
  }
  if (action.units.length < 1 || action.units.length > 2) {
    throw new Error(
      `${sourcePath}: simple event damage requires an Hp unit and optional Poise unit`,
    );
  }
  const unit = action.units[0]!;
  const poiseUnit = action.units[1];
  const damageType = projectNativeDamageElement(
    unit.damageType,
    `${sourcePath}.units[0].damageType`,
  );
  // 1.4.4 DamageAction._ProcessDamage (RVA 0x03540901..0x035409fb) 只在目标能力系统
  // 等于 BattleManager 当前 Guard 列表成员时乘 reduceDamageForGuardRatio。此入口的目标已由
  // 上方证明为唯一敌方木桩，不可能是玩家 Guard；保留字段校验，但不把玩家受击分支带入模拟。
  if (
    unit.attributeType !== 'Hp' ||
    unit.poiseCalculation !== null ||
    unit.onlyEnableForMainOperator ||
    unit.ignoreDamageImmuneLevel !== 'None' ||
    unit.ignorePoiseImmune ||
    unit.gainCost
  ) {
    throw new Error(`${sourcePath}: unsupported simple event DamageUnit behavior`);
  }
  // 1.4.4 DamageAction._ProcessDamage: damageAttributeType (+0x14)
  // branches at RVA 0x0353FFE5. Only the Poise branch at 0x035415A3 reads the
  // +0x68 poiseCalculation field. A serialized object on an Hp unit is inactive
  // payload and must not synthesize an additional poise operation.
  const breakingCalculation =
    !unit.simpleCalculation &&
    unit.serializedAttackCalculationPresent &&
    unit.attackCalculation?.kind === 'breakingAttack'
      ? unit.attackCalculation
      : null;
  const attributeCalculation =
    !unit.simpleCalculation &&
    unit.serializedAttackCalculationPresent &&
    unit.attackCalculation?.kind === 'attribute'
      ? unit.attackCalculation
      : null;
  if (attributeCalculation !== null && attributeCalculation.valueSource !== 'AttackerOrHealer') {
    throw new Error(`${sourcePath}: unsupported event attack calculation source`);
  }
  if (
    breakingCalculation !== null &&
    (unit.takeAttackSnapshot ||
      breakingCalculation.multiplier.blackboardKey !== null ||
      breakingCalculation.multiplier.levelValues !== null)
  ) {
    throw new Error(`${sourcePath}: snapshot/dynamic breaking-attack multiplier is unsupported`);
  }
  const attackScale = unit.simpleCalculation
    ? unit.attackScale
    : unit.serializedAttackCalculationPresent &&
        (unit.attackCalculation?.kind === 'attackScale' ||
          unit.attackCalculation?.kind === 'breakingAttack')
      ? unit.attackCalculation.attackScale
      : attributeCalculation !== null
        ? attributeCalculation.multiplier
        : null;
  if (attackScale === null) {
    throw new Error(`${sourcePath}: unsupported event attack calculation`);
  }
  const instantAttributeModifiers = unit.processors.flatMap((processor, index) => {
    const processorPath = `${sourcePath}.units[0].processors[${index}]`;
    if (processor.kind === 'damageScale') return [];
    if (
      processor.kind !== 'instantAttributeModifier' ||
      processor.modifyAttributeType !== 'Specific'
    ) {
      throw new Error(`${sourcePath}.units[0].processors[${index}]: unsupported processor`);
    }
    const targetSide =
      processor.targetSide === 'Attacker'
        ? ('attacker' as const)
        : processor.targetSide === 'Defender'
          ? ('defender' as const)
          : null;
    if (targetSide === null) throw new Error(`${processorPath}: unsupported instant target side`);
    // 保持已验证的能力边界；属性身份和公式槽解释复用 Buff 的公共编译入口。
    const supportedMapping =
      (targetSide === 'attacker' &&
        ['Atk', 'CriticalRate', 'CriticalDamageIncrease'].includes(processor.attributeType) &&
        ['BaseAddition', 'BaseMultiplier', 'FinalMultiplier'].includes(processor.formulaItem)) ||
      (targetSide === 'defender' &&
        processor.attributeType === 'CrystVulnerableDmgIncrease' &&
        processor.formulaItem === 'BaseFinalMultiplier');
    if (!supportedMapping) {
      throw new Error(`${processorPath}: unsupported instant attribute mapping`);
    }
    const compiled = compileResolvedAttributeModifierSource({
      sourcePath: processorPath,
      modifyAttributeType: processor.modifyAttributeType,
      attributeType: processor.attributeType,
      formulaItem: processor.formulaItem,
      value: 0,
    });
    return [
      {
        targetSide,
        attribute: projectCombatRuntimeAttributeKey(processor.attributeType),
        slot: compiled.slot,
        value: scalarOperand(processor.parameter),
        attributeTiming: 'runtime' as const,
      },
    ];
  });
  const instantDamageScaleModifiers = unit.processors.flatMap((processor, index) => {
    if (processor.kind !== 'damageScale') return [];
    const processorPath = `${sourcePath}.units[0].processors[${index}]`;
    const sides: Readonly<Record<string, DamageModifierSide>> = {
      Attacker: 'attacker',
      Defender: 'defender',
    };
    const side = sides[processor.side];
    const zone = {
      ProdCalcZone: 'product',
      NormalCalcZone: 'normal',
      AbnormalAndBurstCalcZone: 'abnormalAndBurst',
      EnhanceCalcZone: 'enhanced',
      ComboCalcZone: 'combo',
      VulnerableCalcZone: 'vulnerable',
      RaceCalcZone: 'race',
    }[processor.zoneName] as
      | 'product'
      | 'normal'
      | 'abnormalAndBurst'
      | 'enhanced'
      | 'combo'
      | 'vulnerable'
      | 'race'
      | undefined;
    if (side === undefined || zone === undefined)
      throw new Error(`${processorPath}: unsupported damage scale side/zone`);
    return [{ side, zone, addition: scalarOperand(processor.addition) }];
  });
  // DamageEnums.g.cs：分类位彼此独立。hitEnvironment 只增加环境命中旁路，不改变同一
  // DamageUnit 对目标的结算；Endaxis 没有可破坏环境，只投影目标伤害。
  // 用安全整数和减法验剩余位，避免 JS 位运算把高位截断后误当作已覆盖。
  const mask = unit.damageDecorateMask;
  const powerAttack = Math.floor(mask / 4) % 2 === 1;
  const normalAttack = Math.floor(mask / 128) % 2 === 1;
  const normalSkill = Math.floor(mask / 256) % 2 === 1;
  const ultimateSkill = Math.floor(mask / 512) % 2 === 1;
  const plungingAttack = Math.floor(mask / 1024) % 2 === 1;
  const canBreakWeakness = Math.floor(mask / 4096) % 2 === 1;
  const comboSkill = Math.floor(mask / 8192) % 2 === 1;
  const crush = Math.floor(mask / 16384) % 2 === 1;
  const airborne = Math.floor(mask / 32768) % 2 === 1;
  // DamageEnums.g.cs：KnockDown=65536 同时属于 PhysicalInfliction 组合掩码。
  const knockDown = Math.floor(mask / 65536) % 2 === 1;
  const dashAttack = Math.floor(mask / 131072) % 2 === 1;
  const normalAttackLastCombo = Math.floor(mask / 2097152) % 2 === 1;
  const fireBurst = Math.floor(mask / 4194304) % 2 === 1;
  const cryoBurst = Math.floor(mask / 8388608) % 2 === 1;
  const electricBurst = Math.floor(mask / 16777216) % 2 === 1;
  const natureBurst = Math.floor(mask / 33554432) % 2 === 1;
  const burning = Math.floor(mask / 67108864) % 2 === 1;
  const shatter = Math.floor(mask / 134217728) % 2 === 1;
  const dot = Math.floor(mask / 268435456) % 2 === 1;
  const remainArea = Math.floor(mask / 536870912) % 2 === 1;
  const fracture = Math.floor(mask / 1073741824) % 2 === 1;
  const talentDamage = Math.floor(mask / 2147483648) % 2 === 1;
  const physicalInfliction = crush || airborne || knockDown || fracture;
  if (
    !Number.isSafeInteger(mask) ||
    mask < 0 ||
    mask -
      (powerAttack ? 4 : 0) -
      (normalAttack ? 128 : 0) -
      (normalSkill ? 256 : 0) -
      (ultimateSkill ? 512 : 0) -
      (plungingAttack ? 1024 : 0) -
      (canBreakWeakness ? 4096 : 0) -
      (comboSkill ? 8192 : 0) -
      (crush ? 16384 : 0) -
      (airborne ? 32768 : 0) -
      (knockDown ? 65536 : 0) -
      (dashAttack ? 131072 : 0) -
      (normalAttackLastCombo ? 2097152 : 0) !==
      (fireBurst ? 4194304 : 0) +
        (cryoBurst ? 8388608 : 0) +
        (electricBurst ? 16777216 : 0) +
        (natureBurst ? 33554432 : 0) +
        (burning ? 67108864 : 0) +
        (shatter ? 134217728 : 0) +
        (dot ? 268435456 : 0) +
        (remainArea ? 536870912 : 0) +
        (fracture ? 1073741824 : 0) +
        (talentDamage ? 2147483648 : 0)
  ) {
    throw new Error(`${sourcePath}: unsupported event damage decorate mask ${mask}`);
  }
  const staggerCalculation =
    poiseUnit === undefined ? undefined : compileSimplePoiseOperand(poiseUnit, sourcePath, 1);
  return {
    kind: 'dealDamage',
    parameters: {
      damageType,
      attackScale: scalarOperand(attackScale),
      ...(unit.takeAttackSnapshot ? { takeAttackSnapshot: true } : {}),
      ...(breakingCalculation === null
        ? {}
        : {
            calculation: 'breakingAttack' as const,
            calculationMultiplier: breakingCalculation.multiplier.value,
          }),
      ...(attributeCalculation === null
        ? {}
        : {
            calculation: 'attribute' as const,
            calculationAttribute: projectCombatRuntimeAttributeKey(
              attributeCalculation.attributeType,
            ),
            calculationAddition: scalarOperand(attributeCalculation.addition),
          }),
      tags: [
        ...(normalAttack ? (['normalAttack'] as const) : []),
        ...(normalAttackLastCombo ? (['normalAttackLastCombo'] as const) : []),
        ...(powerAttack ? (['powerAttack'] as const) : []),
        ...(plungingAttack ? (['plungingAttack'] as const) : []),
        ...(dashAttack ? (['dashAttack'] as const) : []),
        ...(normalSkill ? (['normalSkill'] as const) : []),
        ...(ultimateSkill ? (['ultimateSkill'] as const) : []),
        ...(comboSkill ? (['comboSkill'] as const) : []),
        ...(fireBurst ? (['fireBurst'] as const) : []),
        ...(cryoBurst ? (['cryoBurst'] as const) : []),
        ...(electricBurst ? (['electricBurst'] as const) : []),
        ...(natureBurst ? (['natureBurst'] as const) : []),
        ...(burning ? (['fireAbnormal'] as const) : []),
        ...(shatter ? (['cryoAbnormal'] as const) : []),
      ],
      ...(unit.gameplayTagIds.length === 0
        ? {}
        : {
            gameplayTags: projectGameplayTags(
              unit.gameplayTagIds,
              context,
              `${sourcePath}.units[0].damageTags`,
            ),
          }),
      ...(canBreakWeakness || dot || remainArea || physicalInfliction || shatter || talentDamage
        ? {
            features: [
              ...(canBreakWeakness ? (['canBreakWeakness'] as const) : []),
              ...(dot ? (['dot'] as const) : []),
              ...(remainArea ? (['remainArea'] as const) : []),
              ...(knockDown ? (['knockDown'] as const) : []),
              ...(physicalInfliction ? (['physicalInfliction'] as const) : []),
              ...(shatter ? (['shatter'] as const) : []),
              ...(talentDamage ? (['talentDamage'] as const) : []),
            ],
          }
        : {}),
      ...(instantAttributeModifiers.length === 0 ? {} : { instantAttributeModifiers }),
      ...(instantDamageScaleModifiers.length === 0 ? {} : { instantDamageScaleModifiers }),
      ...(staggerCalculation === undefined ? {} : { stagger: staggerCalculation.value }),
      ...(staggerCalculation?.multiplier === undefined
        ? {}
        : { staggerMultiplier: staggerCalculation.multiplier }),
      ...(poiseUnit?.onlyEnableForMainOperator ? { staggerOnlyWhenCasterControlled: true } : {}),
    },
  };
}

/** 投影只含一个原生 Poise DamageUnit 的动作；它不制造零生命伤害命中。 */
export function compileEventTargetSimplePoiseOperationSource(
  action: DamageActionSource,
  sourcePath: string,
  context: {
    readonly actionOwnerTarget: 'buffOwner' | 'caster' | 'unavailable';
    readonly actionSourceTarget: 'caster';
    readonly fixedBuffOwnerTarget?: 'caster' | 'enemy' | 'currentAbilityEntity';
    readonly staticEnemyTargetGroupKeys?: ReadonlySet<string>;
  } = { actionOwnerTarget: 'caster', actionSourceTarget: 'caster' },
): CompiledSimplePoiseOperationSource {
  if (action.units.length !== 1 || action.units[0]!.attributeType !== 'Poise')
    throw new Error(`${sourcePath}: expected one Poise DamageUnit`);
  requireDamageCasterOwner(action, context, sourcePath);
  if (
    !action.alwaysNext ||
    (action.attacker !== 'ActionSource' && action.attacker !== 'ActionOwner')
  )
    throw new Error(`${sourcePath}: unsupported poise damage action control flags`);
  if (action.target.targetSource === 'Context') {
    if (
      !action.target.targetGroupKey ||
      !context.staticEnemyTargetGroupKeys?.has(action.target.targetGroupKey)
    )
      throw new Error(`${sourcePath}.target: unsupported poise damage target`);
  } else if (action.target.targetSource === 'Owner' && context.fixedBuffOwnerTarget === 'enemy') {
    requireFixedTarget(action.target, 'Owner', `${sourcePath}.target`);
  } else {
    requireFixedTarget(action.target, 'Target', `${sourcePath}.target`);
  }
  if (action.effectSource.targetSource !== 'Owner' && action.effectSource.targetSource !== 'Source')
    throw new Error(`${sourcePath}.effectSource: unsupported poise damage source`);
  requireFixedTarget(
    action.effectSource,
    action.effectSource.targetSource,
    `${sourcePath}.effectSource`,
  );
  const unit = action.units[0]!;
  const features =
    unit.damageDecorateMask === 0
      ? []
      : unit.damageDecorateMask === 4096
        ? (['canBreakWeakness'] as const)
        : null;
  if (features === null) {
    throw new Error(
      `${sourcePath}: unsupported event Poise decorate mask ${unit.damageDecorateMask}`,
    );
  }
  const calculation = compileSimplePoiseOperand(unit, sourcePath, 0, unit.damageDecorateMask);
  return {
    kind: 'dealStagger',
    parameters: {
      value: calculation.value,
      ...(calculation.multiplier === undefined ? {} : { valueMultiplier: calculation.multiplier }),
      ...(features.length === 0 ? {} : { features }),
    },
  };
}

/** Hp 与 Poise 共用来源证明，敌人持有的载体不能把 Owner 冒充施术干员。 */
function requireDamageCasterOwner(
  action: DamageActionSource,
  context: {
    readonly actionOwnerTarget: 'buffOwner' | 'caster' | 'unavailable';
    readonly fixedBuffOwnerTarget?: 'caster' | 'enemy' | 'currentAbilityEntity';
  },
  sourcePath: string,
): void {
  if (action.attacker !== 'ActionOwner') return;
  if (context.actionOwnerTarget === 'unavailable') {
    throw new Error(`${sourcePath}: damage action Owner projection is unavailable`);
  }
  if (context.fixedBuffOwnerTarget === 'enemy') {
    throw new Error(`${sourcePath}: enemy Buff Owner cannot be projected as the damage caster`);
  }
}

function compileSimplePoiseOperand(
  unit: DamageActionSource['units'][number],
  sourcePath: string,
  unitIndex: number,
  acceptedDecorateMask = 0,
): Readonly<{
  value: CompiledActionValueOperandSource;
  multiplier?: CompiledActionValueOperandSource;
}> {
  const calculation = unit.poiseCalculation;
  if (
    unit.attributeType !== 'Poise' ||
    unit.takeAttackSnapshot ||
    unit.attackCalculation !== null ||
    !unit.serializedPoiseCalculationPresent ||
    calculation?.kind !== 'definite' ||
    unit.processors.length > 0 ||
    unit.damageDecorateMask !== acceptedDecorateMask ||
    unit.ignoreDamageImmuneLevel !== 'None' ||
    unit.ignorePoiseImmune ||
    unit.reduceDamageForGuard ||
    unit.gainCost
  ) {
    throw new Error(`${sourcePath}: unsupported simple event Poise DamageUnit behavior`);
  }
  // 原生 PlayerDamageActionDataAdapter 在 Poise 分支只构造 poiseCalculation；顶层 atkScale
  // 仍会被反序列化，但不会进入 PoisePack 或失衡公式，因此其字面值/黑板键都是序列化残留。
  // PoisePack 原生规格不保存元素字段，修正器只读取 decorate mask；仍验证来源元素是已知枚举。
  projectNativeDamageElement(unit.damageType, `${sourcePath}.units[${unitIndex}].damageType`);
  // 原生定值计算在 applyScale=false 时不求值 valueScale；启用时
  // valueScale 以单精度解析后乘到基础值，运行时由 stagger multiplier 保留这一步。
  return {
    value: scalarOperand(calculation.value),
    ...(calculation.applyScale ? { multiplier: scalarOperand(calculation.valueScale) } : {}),
  };
}

function requireFixedTarget(
  target: TargetReferenceSource,
  targetSource: 'Target' | 'Owner' | 'Source',
  sourcePath: string,
): void {
  if (target.targetSource !== targetSource) {
    throw new Error(`${sourcePath}: unsupported simple event damage target`);
  }
  // 反编译已确认只有 Context 来源读取 targetGroupKey；固定 Target/Owner 上的同名字段是残留值。
}

function scalarOperand(source: ScalarSource): CompiledActionValueOperandSource {
  return source.blackboardKey === null
    ? { kind: 'constant', value: source.value }
    : { kind: 'blackboard', key: source.blackboardKey };
}
