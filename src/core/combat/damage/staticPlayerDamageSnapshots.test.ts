import { createKillEvent } from '../events/killEventTestFixture';
import { describe, expect, it } from 'vitest';
import type { ResolvedCombatStepForKind } from '../../compiler/combatProgram';
import type { ResolvedOperatorPanel } from '../../compiler/resolveOperatorPanel';
import { CombatClock } from '../time/combatClock';
import { CombatResources } from '../resources/combatResources';
import type {
  CombatEnemyProgram,
  CombatOperationExecutorContext,
  EquipmentEventOperationExecutorContext,
} from '../runtime/combatRuntimeAssembly';
import { CombatReceiptCollector } from '../receipt/combatReceipt';
import { CombatVitals } from '../resources/combatVitals';
import { PlayerDamageOperationExecutor } from './playerDamageOperationExecutor';
import { freezeAttackReceiptDetail } from './attackReceiptDetail';
import type { CombatOperationExecutor } from '../skills/skillRuntime';
import {
  initializeEnemyCombatAttributes,
  resolveStaticPlayerDamageSnapshots,
} from './staticPlayerDamageSnapshots';
import { CombatSemanticEventRuntime } from '../events/combatSemanticEventRuntime';
import { createOperatorAttackAttributes } from '../attributes/operatorAttackAttributes';
import { ATTRIBUTE_MODIFIER_SOURCES } from '../state/foundationState';
import {
  attributeModifierValues,
  createCombatAttributeModifier,
  CombatAttributeSet,
} from '../attributes/combatAttributes';

const enemy: CombatEnemyProgram = {
  source: { kind: 'custom', level: 90 },
  rank: 'mob',
  health: 100000,
  superArmor: 0,
  defenderAttributes: {
    defense: 200,
    shelterDamageMultiplier: 0,
    breakingAttackDamageTakenMultiplier: 1.5,
    resistances: {
      physical: { percent: 0, damageTakenMultiplier: 1 },
      heat: { percent: 0, damageTakenMultiplier: 1 },
      electric: { percent: 20, damageTakenMultiplier: 1 },
      cryo: { percent: 0, damageTakenMultiplier: 1 },
      nature: { percent: 0, damageTakenMultiplier: 1 },
      ether: { percent: 0, damageTakenMultiplier: 1 },
    },
  },
  stagger: {
    maximum: 300,
    knotThresholds: [0.5],
    knotBreakDurationFrames: 60,
    brokenDurationFrames: 300,
    finisherSpRecovery: 100,
  },
};

const panel: ResolvedOperatorPanel = {
  operatorId: 'operator',
  level: 1,
  attributes: { strength: 0, agility: 0, intellect: 0, will: 0 },
  attack: 700,
  attackBeforeAttributeScalar: 700,
  mainAttribute: 'intellect',
  secondaryAttribute: 'will',
  health: 5000,
  defense: 0,
  criticalRate: 0.15,
  criticalDamage: 0.6,
  artsIntensity: 0,
  ultimateEnergyGainEfficiency: 1,
  skillCooldownReduction: 0,
  staggerDamagePercent: 0,
  combatModifiers: [
    { kind: 'damageBonus', damageTypes: 'electric', skillTypes: 'battleSkill', value: 0.2 },
    { kind: 'damageBonus', damageTypes: 'heat', value: 0.5 },
  ],
  receipt: [],
};

function createContext(overrides: Partial<CombatOperationExecutorContext> = {}) {
  return {
    program: {
      operatorId: 'operator',
      skillGroupKey: 'battleSkill',
      skillId: 'battleSkill',
      skillType: 'battleSkill',
      skillLevel: 1,
      initialBlackboard: {},
      timelineBlockFrames: 1,
      costFrame: 0,
      costs: [],
      timelineActions: [],
    },
    enemy,
    panel,
    equipmentContributions: [],
    clock: new CombatClock(),
    resources: new CombatResources({
      sp: 0,
      maxSp: 300,
      returnedSp: 0,
      sharedSpGain: { baseGainEfficiency: 1 },
      spRecovery: { valuePerSecond: 0, pauseDuration: 0, pauseRemaining: 0 },
      ultimateEnergySystemUnlocked: false,
      normalSkillUltimateEnergy: { selfGainPerSp: 0, otherGainPerSp: 0 },
      squad: [],
    }),
    receipt: new CombatReceiptCollector(),
    semanticEvents: new CombatSemanticEventRuntime(),
    ...overrides,
  } satisfies CombatOperationExecutorContext;
}

const electricDamage: ResolvedCombatStepForKind<'dealDamage'> = {
  kind: 'dealDamage',
  parameters: { damageType: 'electric', attackScale: 1, tags: ['normalSkill'] },
};

describe('resolveStaticPlayerDamageSnapshots', () => {
  it('preserves distinct static providers and applies the existing element and skill filters', () => {
    const first = { kind: 'equipment', contribution: { kind: 'gearSet', slug: 'first' } } as const;
    const second = {
      kind: 'equipment',
      contribution: { kind: 'gearSet', slug: 'second' },
    } as const;
    const context = createContext({
      panel: {
        ...panel,
        combatModifiers: [
          {
            kind: 'damageBonus',
            damageTypes: 'electric',
            skillTypes: 'battleSkill',
            value: 0.2,
            source: first,
          },
          {
            kind: 'damageScale',
            target: 'electric',
            slot: 'baseAddition',
            value: 0.1,
            source: second,
          },
        ],
      },
    });
    const attributes = createOperatorAttackAttributes(context.panel!);
    const electric = resolveStaticPlayerDamageSnapshots(
      context,
      electricDamage,
      attributes,
    ).attacker;
    expect(electric.electricDamageIncrease).toBeCloseTo(0.3);
    expect(electric.modifierDetails?.map(item => item.panelSource)).toEqual([first, second]);
    const heat = resolveStaticPlayerDamageSnapshots(
      context,
      {
        ...electricDamage,
        parameters: { ...electricDamage.parameters, damageType: 'heat' },
      },
      attributes,
    ).attacker;
    expect(heat.modifierDetails?.map(item => item.panelSource)).toEqual([second]);
    const normal = resolveStaticPlayerDamageSnapshots(
      {
        ...context,
      program: { ...context.program, skillType: 'basicAttack' },
      },
      electricDamage,
      attributes,
    ).attacker;
    expect(normal.modifierDetails?.map(item => item.panelSource)).toEqual([second]);
  });
  it('freezes dynamic attack components and floored attributes from the same read', () => {
    const dynamicPanel: ResolvedOperatorPanel = {
      ...panel,
      attributes: { strength: 0, agility: 0, intellect: 123.8, will: 60.5 },
      attackBase: { rawValue: 700, baseMultiplier: 0.2, baseFinalAddition: 10 },
      attackDetail: {
        operatorBaseAttack: 500,
        weaponBaseAttack: 200,
        attackPercent: 0.2,
        flatAttack: 10,
      },
    };
    const attributes = createOperatorAttackAttributes(dynamicPanel);
    const bonus = createCombatAttributeModifier(
      'Atk',
      attributeModifierValues('baseMultiplier', 0.18),
      ATTRIBUTE_MODIFIER_SOURCES.buff,
      'runtime',
    );
    attributes.addModifier(bonus);
    attributes.addModifier(
      createCombatAttributeModifier(
        'Atk',
        attributeModifierValues('finalMultiplier', 1.1),
        ATTRIBUTE_MODIFIER_SOURCES.buff,
        'runtime',
      ),
    );
    const captured = resolveStaticPlayerDamageSnapshots(
      createContext({ panel: dynamicPanel }),
      electricDamage,
      attributes,
    ).attacker;
    const frozen = freezeAttackReceiptDetail(captured.attack, captured.attackDetail);
    const base = (700 * 1.38 + 10) * 1.1;
    expect(captured.attack).toBe(Math.floor(base * (1 + 123 * 0.005 + 60 * 0.002)));
    expect(frozen.attackDetailActualBase).toBeCloseTo(base);
    expect(frozen).toMatchObject({
      attackDetailIntellect: 123,
      attackDetailWill: 60,
      'attackDetailSlot:finalMultiplier': 1.1,
    });
    attributes.removeModifier(bonus);
    attributes.setRawValue('intellect', 999);
    expect(freezeAttackReceiptDetail(captured.attack, captured.attackDetail)).toEqual(frozen);
  });
  it('庇护属性保留原始无界槽，只有敌方快照影响对敌伤害', () => {
    const attacker = createOperatorAttackAttributes(panel);
    const defender = new CombatAttributeSet<string>();
    initializeEnemyCombatAttributes(defender, {
      ...enemy.defenderAttributes,
      shelterDamageMultiplier: 0.1,
    });
    const modifier = createCombatAttributeModifier(
      'shelterDamageMultiplier',
      attributeModifierValues('baseAddition', 0.2),
      ATTRIBUTE_MODIFIER_SOURCES.buff,
      'runtime',
    );
    attacker.addModifier(modifier);
    expect(
      resolveStaticPlayerDamageSnapshots(createContext(), electricDamage, attacker, defender)
        .defender.shelterDamageMultiplier,
    ).toBe(0.1);
    defender.addModifier(modifier);
    expect(
      resolveStaticPlayerDamageSnapshots(createContext(), electricDamage, attacker, defender)
        .defender.shelterDamageMultiplier,
    ).toBeCloseTo(0.3);
    defender.removeModifier(modifier);
    expect(defender.get('shelterDamageMultiplier')).toBe(0.1);
  });
  it('完整暴击面板经共同属性槽求值，技能局部修正不污染其他快照', () => {
    const attributes = createOperatorAttackAttributes(panel);
    attributes.addModifier(
      createCombatAttributeModifier(
        'criticalRate',
        attributeModifierValues('finalMultiplier', 0.5),
        ATTRIBUTE_MODIFIER_SOURCES.buff,
        'runtime',
      ),
    );
    attributes.addModifier(
      createCombatAttributeModifier(
        'criticalDamageIncrease',
        attributeModifierValues('finalMultiplier', 2),
        ATTRIBUTE_MODIFIER_SOURCES.buff,
        'runtime',
      ),
    );
    const base = createContext();
    const boosted = { ...base, program: { ...base.program, statModifiers: { criticalRate: 0.3 } } };
    expect(
      resolveStaticPlayerDamageSnapshots(boosted, electricDamage, attributes).attacker,
    ).toMatchObject({ criticalRate: (0.15 + 0.3) * 0.5, criticalDamageIncrease: 1.2 });
    expect(
      resolveStaticPlayerDamageSnapshots(boosted, electricDamage, attributes).attacker
        .modifierDetails,
    ).toEqual([
      {
        kind: 'attribute',
        sourceId: 'operator',
        sourceActionId: 'battleSkill',
        side: 'attacker',
        attribute: 'criticalRate',
        slot: 'baseAddition',
        value: 0.3,
      },
    ]);
    expect(
      resolveStaticPlayerDamageSnapshots(base, electricDamage, attributes).attacker.criticalRate,
    ).toBeCloseTo(0.075);
    expect(attributes.get('criticalRate')).toBeCloseTo(0.075);
    expect(attributes.modifierCount).toBe(2);
    expect(panel.criticalRate).toBe(0.15);
  });

  it('配装快照不读取触发技能修正，但保留面板的无条件类型增伤', () => {
    const skillContext = createContext();
    const { program: _program, equipmentContributions: _contributions, ...battle } = skillContext;
    const context: EquipmentEventOperationExecutorContext = {
      ...battle,
      operatorId: 'operator',
      source: { kind: 'weaponTrait', slug: 'fixture', traitKey: 'effect' },
      handlerKey: 'extra',
      event: {
        event: 'outputDamage',
        payload: { ...createKillEvent().payload, tags: ['normalSkill'] },
      },
    };
    const attributes = createOperatorAttackAttributes(panel);
    const electric = resolveStaticPlayerDamageSnapshots(context, electricDamage, attributes);
    const heat = resolveStaticPlayerDamageSnapshots(
      context,
      { ...electricDamage, parameters: { ...electricDamage.parameters, damageType: 'heat' } },
      attributes,
    );
    expect(electric.attacker.electricDamageIncrease).toBe(0);
    expect(electric.attacker.criticalRate).toBe(panel.criticalRate);
    expect(electric.attacker.damageToStaggeredEnemyIncrease).toBe(0);
    expect(heat.attacker.heatDamageIncrease).toBe(0.5);
  });

  it('从同一构筑面板和敌人程序冻结基础攻防属性', () => {
    const snapshots = resolveStaticPlayerDamageSnapshots(
      createContext(),
      electricDamage,
      createOperatorAttackAttributes(panel),
    );

    expect(snapshots.attacker).toMatchObject({
      attack: 700,
      criticalRate: 0.15,
      criticalDamageIncrease: 0.6,
      electricDamageIncrease: 0.2,
    });
    expect(snapshots.defender).toMatchObject({
      defense: 200,
      breakingAttackDamageTakenMultiplier: 1.5,
      resistances: { electric: { percent: 20, damageTakenMultiplier: 1 } },
    });
  });

  it('从敌方运行时八槽冻结被 Buff 修改后的元素抗性', () => {
    const enemyAttributes = new CombatAttributeSet<string>();
    initializeEnemyCombatAttributes(enemyAttributes, enemy.defenderAttributes);
    enemyAttributes.addModifier(
      createCombatAttributeModifier(
        'PulseResistance',
        attributeModifierValues('baseAddition', -15),
        ATTRIBUTE_MODIFIER_SOURCES.instant,
        'runtime',
      ),
    );

    const snapshots = resolveStaticPlayerDamageSnapshots(
      createContext(),
      electricDamage,
      createOperatorAttackAttributes(panel),
      enemyAttributes,
    );

    expect(snapshots.defender.resistances.electric).toEqual({
      percent: 5,
      damageTakenMultiplier: 1,
    });
  });

  it.each([
    'physicalVulnerabilityIncrease',
    'heatVulnerabilityIncrease',
    'electricVulnerabilityIncrease',
    'cryoVulnerabilityIncrease',
    'natureVulnerabilityIncrease',
    'etherVulnerabilityIncrease',
  ] as const)('敌人 %s 从运行时冻结，撤销修正不改变既有命中快照', attribute => {
    const enemyAttributes = new CombatAttributeSet<string>();
    initializeEnemyCombatAttributes(enemyAttributes, enemy.defenderAttributes);
    const modifier = createCombatAttributeModifier(
      attribute,
      attributeModifierValues('baseAddition', 0.3),
      ATTRIBUTE_MODIFIER_SOURCES.instant,
      'runtime',
    );
    const snapshot = () =>
      resolveStaticPlayerDamageSnapshots(
        createContext(),
        electricDamage,
        createOperatorAttackAttributes(panel),
        enemyAttributes,
      );
    expect(snapshot().defender[attribute]).toBe(0);
    enemyAttributes.addModifier(modifier);
    const active = snapshot();
    expect(active.defender[attribute]).toBeCloseTo(0.3);
    expect(active.attacker[attribute]).toBe(0);
    enemyAttributes.removeModifier(modifier);
    expect(snapshot().defender[attribute]).toBe(0);
    expect(active.defender[attribute]).toBeCloseTo(0.3);
  });

  it('只把当前技能程序的暴击率修正加入该技能伤害快照', () => {
    const snapshots = resolveStaticPlayerDamageSnapshots(
      createContext({
        program: {
          ...createContext().program,
          skillGroupKey: 'ultimate',
          skillType: 'ultimate',
          statModifiers: { criticalRate: 0.3 },
        },
      }),
      electricDamage,
      createOperatorAttackAttributes(panel),
    );

    expect(snapshots.attacker.criticalRate).toBeCloseTo(0.45);
    expect(panel.criticalRate).toBe(0.15);
  });

  it('把当前技能的失衡目标增伤写入既有实时条件伤害属性', () => {
    const snapshots = resolveStaticPlayerDamageSnapshots(
      createContext({
        program: {
          ...createContext().program,
          statModifiers: { damageToStaggeredEnemyIncrease: 0.3 },
        },
      }),
      electricDamage,
      createOperatorAttackAttributes(panel),
    );

    expect(snapshots.attacker.damageToStaggeredEnemyIncrease).toBeCloseTo(0.3);
    expect(snapshots.defender.damageToStaggeredEnemyIncrease).toBe(0);
  });

  it('按伤害类型和技能类型筛选静态伤害加成', () => {
    const snapshots = resolveStaticPlayerDamageSnapshots(
      createContext({
        program: { ...createContext().program, skillType: 'comboSkill' },
      }),
      electricDamage,
      createOperatorAttackAttributes(panel),
    );

    expect(snapshots.attacker.electricDamageIncrease).toBe(0);
    expect(snapshots.attacker.heatDamageIncrease).toBe(0);
  });

  it('按原生属性身份冻结潜能的技能分类与伤害类型增伤', () => {
    const snapshots = resolveStaticPlayerDamageSnapshots(
      createContext({
        panel: {
          ...panel,
          combatModifiers: [
            { kind: 'staticDamageIncrease', target: 'normalAttack', value: 0.15 },
            { kind: 'staticDamageIncrease', target: 'battleSkill', value: 0.16 },
            { kind: 'staticDamageIncrease', target: 'physical', value: 0.08 },
            { kind: 'staticDamageIncrease', target: 'electric', value: 0.09 },
            { kind: 'staticDamageIncrease', target: 'cryo', value: 0.1 },
          ],
        },
      }),
      electricDamage,
      createOperatorAttackAttributes(panel),
    );

    expect(snapshots.attacker).toMatchObject({
      normalAttackDamageIncrease: 0.15,
      normalSkillDamageIncrease: 0.16,
      physicalDamageIncrease: 0.08,
      electricDamageIncrease: 0.09,
      cryoDamageIncrease: 0.1,
    });
  });

  it('按原生属性身份冻结装备的完整伤害倍率', () => {
    const equippedPanel = {
      ...panel,
      combatModifiers: [
        { kind: 'damageScale', target: 'comboSkill', slot: 'baseAddition', value: 0.16 },
        { kind: 'damageScale', target: 'nature', slot: 'addition', value: 0.09 },
        {
          kind: 'damageScale',
          target: 'staggeredEnemy',
          slot: 'baseAddition',
          value: 0.12,
        },
      ],
    } as const;
    const snapshots = resolveStaticPlayerDamageSnapshots(
      createContext({
        panel: equippedPanel,
      }),
      electricDamage,
      createOperatorAttackAttributes(equippedPanel),
    );

    expect(snapshots.attacker).toMatchObject({
      comboSkillDamageIncrease: 0.16,
      natureDamageIncrease: 0.09,
      damageToStaggeredEnemyIncrease: 0.12,
    });
  });

  it('把运行时 Buff 的伤害属性修正叠加到静态构筑增伤', () => {
    const attributes = createOperatorAttackAttributes(panel);
    attributes.addModifier(
      createCombatAttributeModifier(
        'electricDamageIncrease',
        attributeModifierValues('baseAddition', 0.12),
        ATTRIBUTE_MODIFIER_SOURCES.converted,
        'runtime',
      ),
    );

    const snapshots = resolveStaticPlayerDamageSnapshots(
      createContext(),
      electricDamage,
      attributes,
    );

    expect(snapshots.attacker.electricDamageIncrease).toBeCloseTo(0.32);
  });

  it('把运行时 Buff 的暴击属性修正叠加到静态面板', () => {
    const attributes = createOperatorAttackAttributes(panel);
    attributes.addModifier(
      createCombatAttributeModifier(
        'criticalRate',
        attributeModifierValues('addition', 0.25),
        ATTRIBUTE_MODIFIER_SOURCES.buff,
        'runtime',
      ),
    );
    attributes.addModifier(
      createCombatAttributeModifier(
        'criticalDamageIncrease',
        attributeModifierValues('addition', 0.5),
        ATTRIBUTE_MODIFIER_SOURCES.buff,
        'runtime',
      ),
    );

    const snapshots = resolveStaticPlayerDamageSnapshots(
      createContext(),
      electricDamage,
      attributes,
    );

    expect(snapshots.attacker.criticalRate).toBeCloseTo(panel.criticalRate + 0.25);
    expect(snapshots.attacker.criticalDamageIncrease).toBeCloseTo(panel.criticalDamage + 0.5);
  });

  it('缺少已解析面板时明确失败', () => {
    expect(() =>
      resolveStaticPlayerDamageSnapshots(
        createContext({ panel: undefined }),
        electricDamage,
        createOperatorAttackAttributes(panel),
      ),
    ).toThrow("operator 'operator' has no resolved panel");
  });

  it('技能级暴击率修正穿过标准伤害执行器并改变暴击结果', () => {
    const context = createContext({
      panel: {
        ...panel,
        combatModifiers: [
          ...panel.combatModifiers,
          {
            kind: 'damageScale',
            target: 'staggeredEnemy',
            slot: 'baseAddition',
            value: 0.2,
            source: { kind: 'equipment', contribution: { kind: 'gearSet', slug: 'stagger-set' } },
          },
        ],
      },
      program: {
        ...createContext().program,
        skillGroupKey: 'ultimate',
        skillType: 'ultimate',
        statModifiers: { criticalRate: 0.3 },
      },
    });
    const targetVitals = new CombatVitals({
      health: 10000,
      maxHealth: 10000,
      maxPoise: 0,
      poise: 0,
      poiseRecoveryTime: 0,
      poiseRecoveryTimeMultiplier: 1,
      poiseBrokenEndTime: 0,
      poiseImmune: false,
    });
    const delegate: CombatOperationExecutor = {
      execute: () => false,
      evaluate: () => false,
    };
    const executor = new PlayerDamageOperationExecutor({
      sourceOperatorId: context.program.operatorId,
      targetId: 'enemy',
      targetVitals,
      clock: context.clock,
      receipt: context.receipt,
      captureAttributeSnapshots: step =>
        resolveStaticPlayerDamageSnapshots(
          context,
          step,
          createOperatorAttackAttributes(context.panel!),
        ),
      // 0.3 高于基础 0.15，但低于技能潜能修正后的 0.45。
      criticalSamples: { nextCriticalSample: () => 0.3 },
      resolveNonRandomRuntimeSnapshot: () => ({
        runtimeExtensionMultiplier: 1,
        appliesIgniteDamageMultiplier: false,
        appliesPhysicalInflictionDamageMultiplier: false,
      }),
      applyDamageModifiers: () => undefined,
      clearInstantAttributeModifiers: () => undefined,
      addInstantAttributeModifier: () => undefined,
      emitPreparationEvent: () => undefined,
      resolvePoiseMultipliers: () => ({ output: 1, taken: 1 }),
      emitHealthSourceEvent: () => undefined,
      emitHealthTargetEvent: () => undefined,
      emitPoiseSourceEvent: () => undefined,
      emitPoiseTargetEvent: () => undefined,
      delegate,
    });

    expect(executor.execute(electricDamage)).toBe(true);
    // 面板中的 20% 电伤加成只筛选 battleSkill，终结技只取得本次暴击率修正。
    expect(targetVitals.health).toBeCloseTo(9701.333333333333);
    expect((context.receipt as CombatReceiptCollector).entries.at(-1)).toMatchObject({
      event: 'DamageApplied',
      data: {
        value: 298.6666666666667,
        isCritical: true,
        criticalMultiplier: 1.6,
        defenseMultiplier: 1 / 3,
        resistanceMultiplier: 0.8,
      },
    });
    const hits = () =>
      (context.receipt as CombatReceiptCollector).entries.filter(
        entry => entry.event === 'DamageApplied',
      );
    const staggerSources = () =>
      hits()
        .at(-1)!
        .appliedDamageModifiers!.filter(
          item => item.kind === 'attribute' && item.attribute === 'damageToStaggeredEnemyIncrease',
        );
    expect(staggerSources()).toEqual([]);
    targetVitals.runtimeState.hasPoiseBrokenTag = true;
    executor.execute(electricDamage);
    expect(hits().at(-1)!.data!.value).toBeCloseTo(298.6666666666667 * 1.2);
    expect(staggerSources()).toEqual([
      {
        kind: 'attribute',
        sourceId: 'operator',
        side: 'attacker',
        zone: 'normal',
        attribute: 'damageToStaggeredEnemyIncrease',
        slot: 'baseAddition',
        value: 0.2,
        panelSource: { kind: 'equipment', contribution: { kind: 'gearSet', slug: 'stagger-set' } },
      },
    ]);
  });
});
