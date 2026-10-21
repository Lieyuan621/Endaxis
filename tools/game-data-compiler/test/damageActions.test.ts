import { createActionGraphBuilder } from '../src/compiler/actions/actionGraphBuilder.ts';
import { describe, expect, it } from 'vitest';

import { parseDamageUnitSource } from '../src/index.ts';
import { parseDamageProcessors } from '../src/source/damageActions.ts';
import { parseTargetReferenceSource } from '../src/source/target.ts';
import { GameplayTagRegistry } from '../src/source/nativeGameplayTags.ts';
import { compileEventTargetSimpleDamageOperationSource } from '../src/compiler/actions/simpleDamageOperation.ts';
import { scalarFixture, targetFixture } from './sourceFixtures.ts';

const BASE_UNIT = {
  damageType: 'Physical',
  damageAttributeType: 'Hp',
  simpleCalculation: true,
  atkScale: scalarFixture(0, 'atk_scale'),
  takeAtkSnapshot: false,
  damageDecorateMask: 0,
  controlEffectRoll: true,
  onlyEnableForMainChar: false,
  damageProcessors: [],
  ignoreDamageImmuneLevel: 'None',
  ignorePoiseImmune: false,
  reduceDamageForGuard: true,
  reduceDamageForGuardRatio: 0.2,
  gainCost: false,
  costDataList: [],
  playDefaultHitEffect: true,
  playHitEffect: true,
  effectData: {},
  playHitSound: true,
  hitSoundData: {},
  playHitFlashEffect: true,
  hideMainCharHpScreenEffect: false,
  hidePoiseUIEffect: false,
  enablePoiseBreakTimeDilation: true,
  damageVisualImportance: 'Level0',
  enableDamageVisualCoalition: false,
  damageVisualCoalitionGroupKey: '',
  alwaysStartNewCoalition: false,
  alwaysEndCoalition: false,
  updatePositionOnCoalition: false,
} as const;

describe('伤害动作公共载荷', () => {
  it.each([
    ['Real', 'true'],
    ['Fixed', 'fixed'],
  ] as const)('%s 保留独立伤害类型以及按目标生命上限计算的操作数', (nativeType, damageType) => {
    const unit = parseDamageUnitSource(
      {
        ...BASE_UNIT,
        damageType: nativeType,
        simpleCalculation: false,
        reduceDamageForGuard: false,
        atkCalculation: {
          $type: 'Beyond.Gameplay.Core.MultiplyAttributeCalculation, Gameplay.Beyond',
          valueSource: 'Target',
          attributeType: 'MaxHp',
          multiplier: scalarFixture(0, 'consume_dmg_scale'),
          addition: scalarFixture(0),
        },
      },
      'unit',
      { consume_dmg_scale: [0.1] },
    );
    const operation = compileEventTargetSimpleDamageOperationSource(
      {
        kind: 'damage',
        alwaysNext: false,
        attacker: 'ActionSource',
        hitEnvironment: false,
        target: parseTargetReferenceSource(targetFixture('Target'), 'target'),
        effectSource: parseTargetReferenceSource(targetFixture('Source'), 'effectSource'),
        units: [unit],
      },
      'damage',
      {
        graph: createActionGraphBuilder(),
        actionTargetTarget: 'actionInputTarget',
        actionOwnerTarget: 'caster',
        actionSourceTarget: 'caster',
      },
    );
    expect(operation).toMatchObject({
      kind: 'dealDamage',
      parameters: {
        damageType,
        calculation: 'attribute',
        calculationAttribute: 'MaxHp',
        attributeSource: 'target',
        attackScale: { kind: 'blackboard', key: 'consume_dmg_scale' },
      },
    });
  });
  it.each([
    ['ActionOwner', 'AttackerOrHealer'],
    ['ActionSource', 'AttackerOrHealer'],
    ['ActionOwner', 'Target'],
    ['ActionSource', 'Target'],
  ] as const)(
    'LifeDrain 保留 %s、%s 属性来源与 Owner 查询，仍为单个伤害节点',
    (attacker, valueSource) => {
      const unit = parseDamageUnitSource(
        {
          ...BASE_UNIT,
          damageType: 'LifeDrain',
          simpleCalculation: false,
          reduceDamageForGuard: false,
          damageDecorateMask: 268435456,
          ignoreDamageImmuneLevel: 'IgnoreDodgeImmune',
          atkCalculation: {
            $type: 'Beyond.Gameplay.Core.MultiplyAttributeCalculation, Gameplay.Beyond',
            valueSource,
            attributeType: 'MaxHp',
            multiplier: scalarFixture(0, 'drain'),
            addition: scalarFixture(0),
          },
        },
        'unit',
        { drain: [0.1] },
      );
      const operation = compileEventTargetSimpleDamageOperationSource(
        {
          kind: 'damage',
          alwaysNext: false,
          attacker,
          hitEnvironment: false,
          target: parseTargetReferenceSource(targetFixture('Owner'), 'target'),
          effectSource: parseTargetReferenceSource(targetFixture('Source'), 'effectSource'),
          units: [unit],
        },
        'damage',
        {
          graph: createActionGraphBuilder(),
          actionTargetTarget: 'actionInputTarget',
          actionOwnerTarget: 'buffOwner',
          actionSourceTarget: 'caster',
          fixedBuffOwnerTarget: 'caster',
        },
      );
      expect(operation).toMatchObject({
        kind: 'dealDamage',
        parameters: {
          alwaysNext: false,
          target: { kind: 'owner' },
          attacker: attacker === 'ActionOwner' ? 'actionOwner' : 'actionSource',
          damageType: 'lifeDrain',
          calculation: 'attribute',
          calculationAttribute: 'MaxHp',
          ...(valueSource === 'Target' ? { attributeSource: 'target' } : {}),
          features: ['dot'],
        },
      });
    },
  );
  const instantModifier = {
    $type: 'Beyond.Gameplay.Core.InstantModifyAttribute, Gameplay.Beyond',
    modifyTargetSide: 'Attacker',
    modifier: {
      modifyAttributeType: 'Specific',
      attributeType: 'CriticalRate',
      formulaItem: 'BaseAddition',
      param: scalarFixture(0, 'critical_rate'),
    },
  };
  const emptyCache = {
    m_attributeModifierLoader: {},
    '<attributeMask>k__BackingField': { lowerMask: 0, higherMask: 0 },
  };

  it('将 VFS 的伤害枚举整数转换成稳定名称', () => {
    expect(
      parseDamageUnitSource(
        {
          ...BASE_UNIT,
          damageType: 3,
          damageAttributeType: 0,
          atkCalculation: null,
          poiseCalculation: null,
          ignoreDamageImmuneLevel: -1,
          damageVisualImportance: 0,
        },
        'unit',
        { atk_scale: [1] },
      ),
    ).toMatchObject({
      damageType: 'Pulse',
      attributeType: 'Hp',
      ignoreDamageImmuneLevel: 'None',
      visualImportance: 0,
      serializedAttackCalculationPresent: false,
      serializedPoiseCalculationPresent: false,
    });
  });

  it('空导出缓存不进入来源 IR，真实属性修正及黑板引用完整保留', () => {
    const blackboard = { critical_rate: [0.1, 0.2] };
    const old = parseDamageProcessors([instantModifier], 'processors', blackboard);
    expect(
      parseDamageProcessors([{ ...instantModifier, ...emptyCache }], 'processors', blackboard),
    ).toEqual(old);
    expect(old[0]).toMatchObject({
      kind: 'instantAttributeModifier',
      targetSide: 'Attacker',
      attributeType: 'CriticalRate',
      parameter: { blackboardKey: 'critical_rate', levelValues: [0.1, 0.2] },
    });
  });

  it.each([
    { m_attributeModifierLoader: {} },
    { ...emptyCache, m_attributeModifierLoader: { value: 1 } },
    { ...emptyCache, '<attributeMask>k__BackingField': { lowerMask: 1, higherMask: 0 } },
    { ...emptyCache, '<attributeMask>k__BackingField': { lowerMask: '0', higherMask: 0 } },
    { ...emptyCache, '<attributeMask>k__BackingField': { lowerMask: 0 } },
  ])('拒绝不完整、非法或非空私有缓存 %j', cache => {
    expect(() =>
      parseDamageProcessors([{ ...instantModifier, ...cache }], 'processors', {}),
    ).toThrow('processors[0]');
  });

  it('新版空伤害标签与旧结构相同，不改倍率、快照或伤害处理器', () => {
    expect(
      parseDamageUnitSource({ ...BASE_UNIT, damageTags: [] }, 'unit', { atk_scale: [0.9] }),
    ).toEqual(parseDamageUnitSource(BASE_UNIT, 'unit', { atk_scale: [0.9] }));
  });

  it.each([null, {}])('拒绝非法伤害标签列表 %j', damageTags => {
    expect(() => parseDamageUnitSource({ ...BASE_UNIT, damageTags }, 'unit', {})).toThrow(
      'unit.damageTags',
    );
  });

  it('非空伤害标签严格保留原生有符号 ID', () => {
    expect(
      parseDamageUnitSource(
        { ...BASE_UNIT, damageTags: [{ tagId: 1208750764 }, { tagId: -1 }] },
        'unit',
        {},
      ).gameplayTagIds,
    ).toEqual([1208750764, -1]);
  });

  it.each(['enemy', 'actionInputTarget'] as const)(
    '保留伤害标签与实际目标绑定：%s',
    actionTargetTarget => {
      const unit = parseDamageUnitSource(
        { ...BASE_UNIT, damageTags: [{ tagId: 1208750764 }] },
        'unit',
        { atk_scale: [0.9] },
      );
      const operation = compileEventTargetSimpleDamageOperationSource(
        {
          kind: 'damage',
          alwaysNext: true,
          attacker: 'ActionOwner',
          target: parseTargetReferenceSource(targetFixture('Target'), 'target'),
          effectSource: parseTargetReferenceSource(targetFixture('Owner'), 'effectSource'),
          hitEnvironment: false,
          units: [unit],
        },
        'damage',
        {
          graph: createActionGraphBuilder(),
          actionOwnerTarget: 'caster',
          actionSourceTarget: 'caster',
          actionTargetTarget,
          gameplayTagRegistry: new GameplayTagRegistry(['Damage/TyphoeaSkill/FloatingHit_Weak']),
        },
      );

      expect(operation.parameters.gameplayTags).toEqual(['Damage/TyphoeaSkill/FloatingHit_Weak']);
      expect(operation.parameters.tags).toEqual([]);
      expect(operation.parameters.target).toEqual({ kind: 'inputTarget' });
    },
  );

  it.each([
    { damageTags: [{}] },
    { damageTags: [{ tagId: 1, extra: true }] },
    { damageTags: [{ tagId: 1.5 }] },
  ])('拒绝非法伤害标签项 %j', ({ damageTags }) => {
    expect(() => parseDamageUnitSource({ ...BASE_UNIT, damageTags }, 'unit', {})).toThrow(
      'unit.damageTags[0]',
    );
  });

  it('简单计算保留失效公式存在性，但不读取其残留黑板值', () => {
    const source = parseDamageUnitSource(
      {
        ...BASE_UNIT,
        atkCalculation: {
          $type: 'Example.MultiplyAttributeCalculation, Example',
          valueSource: 'AttackerOrHealer',
          attributeType: 'Atk',
          multiplier: {
            useBlackboardKey: true,
            value: 1,
            blackboardKey: '',
          },
          addition: scalarFixture(0),
        },
      },
      'fixture.damageUnit',
      { atk_scale: [0.9] },
    );
    expect(source).toMatchObject({
      simpleCalculation: true,
      attackScale: { blackboardKey: 'atk_scale', levelValues: [0.9] },
      serializedAttackCalculationPresent: true,
      attackCalculation: null,
    });
  });

  it('HP 单元保留但不解释原生未启用的失衡计算载荷', () => {
    const source = parseDamageUnitSource(
      {
        ...BASE_UNIT,
        poiseCalculation: {
          $type: 'Example.DefiniteValueCalculation, Example',
          value: scalarFixture(1),
          applyScale: false,
          valueScale: scalarFixture(0),
        },
      },
      'fixture.damageUnit',
      { atk_scale: [0.9] },
    );

    expect(source).toMatchObject({
      attributeType: 'Hp',
      serializedPoiseCalculationPresent: true,
      poiseCalculation: null,
    });
  });

  it('Poise 单元保留但不解释原生未启用的 HP 计算载荷', () => {
    const source = parseDamageUnitSource(
      {
        ...BASE_UNIT,
        damageAttributeType: 'Poise',
        simpleCalculation: false,
        atkCalculation: {
          $type: 'Example.DefiniteValueCalculation, Example',
          value: scalarFixture(1),
          applyScale: false,
          valueScale: scalarFixture(0),
        },
        poiseCalculation: {
          $type: 'Example.DefiniteValueCalculation, Example',
          value: scalarFixture(0, 'poise'),
          applyScale: false,
          valueScale: scalarFixture(0),
        },
      },
      'fixture.damageUnit',
      { poise: [20] },
    );

    expect(source).toMatchObject({
      attributeType: 'Poise',
      simpleCalculation: false,
      serializedAttackCalculationPresent: true,
      attackCalculation: null,
      poiseCalculation: { kind: 'definite' },
    });
  });

  it('非简单计算复用公共公式并保留处理器与资源载荷', () => {
    const source = parseDamageUnitSource(
      {
        ...BASE_UNIT,
        simpleCalculation: false,
        atkCalculation: {
          $type: 'Example.BreakingAttackCalculation, Example',
          atkScale: scalarFixture(1),
          multiplier: scalarFixture(0, 'break_scale'),
        },
        damageProcessors: [
          {
            $type: 'Example.DamageScaleProcessor, Example',
            side: 'Attacker',
            zoneName: 'NormalCalcZone',
            addition: scalarFixture(0, 'damage_up'),
          },
        ],
        costDataList: [{ costType: 'UltimateSp', costValue: 0.5, atbValueThreshold: 0 }],
      },
      'fixture.damageUnit',
      { break_scale: [0.5], damage_up: [0.2] },
    );
    expect(source).toMatchObject({
      attackCalculation: {
        kind: 'breakingAttack',
        multiplier: { blackboardKey: 'break_scale', levelValues: [0.5] },
      },
      processors: [
        {
          kind: 'damageScale',
          addition: { blackboardKey: 'damage_up', levelValues: [0.2] },
        },
      ],
      costs: [{ costType: 'UltimateSp', costValue: 0.5 }],
    });
  });
});
