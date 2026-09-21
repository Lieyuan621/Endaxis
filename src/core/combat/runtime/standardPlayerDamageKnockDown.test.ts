import { describe, expect, it, vi } from 'vitest';
import { compileOperatorBuffDefinitions } from '../../compiler/compileSkill';
import type { CompiledSkillProgram } from '../../compiler/combatProgram';
import { GameplayTagPredefine } from '../tags/gameplayTagPredefine';
import { GAMEPLAY_TAG_PREDEFINE } from '../../../data/combat/gameplayTagPredefine.generated';
import { gameplayTagRegistry } from '../../../data/combat/gameplayTagCatalog';
import { CombatRuntimeAssembly, type CombatEnemyProgram } from './combatRuntimeAssembly';
import { StandardPlayerDamageEnvironment } from './standardPlayerDamageEnvironment';
import { createEnemyCombatVitals } from '../resources/combatVitalsFactory';
import type { OrdinaryKnockDownRuntime } from '../status/ordinaryKnockDownRuntime';
import {
  createCombatAttributeModifier,
  attributeModifierValues,
} from '../attributes/combatAttributes';
import { ATTRIBUTE_MODIFIER_SOURCES } from '../state/foundationState';
import type { BuffDefinitionOperationTarget } from '../buffs/buffDefinitionOperationTarget';
import { knockDownAbilityEvent } from '../events/combatAbilityEvent';

const DOWN_TAG = 'Status/Immobilized/KnockDown';
const enemy: CombatEnemyProgram = {
  source: { kind: 'custom', level: 90 },
  rank: 'mob',
  health: 10000,
  superArmor: 0,
  defenderAttributes: {
    defense: 0,
    shelterDamageMultiplier: 0,
    breakingAttackDamageTakenMultiplier: 1,
    resistances: {
      physical: { percent: 0, damageTakenMultiplier: 1 },
      heat: { percent: 0, damageTakenMultiplier: 1 },
      electric: { percent: 0, damageTakenMultiplier: 1 },
      cryo: { percent: 0, damageTakenMultiplier: 1 },
      nature: { percent: 0, damageTakenMultiplier: 1 },
      ether: { percent: 0, damageTakenMultiplier: 1 },
    },
  },
  stagger: {
    maximum: 100,
    knotThresholds: [0.5],
    knotBreakDurationFrames: 30,
    brokenDurationFrames: 300,
    finisherSpRecovery: 100,
  },
};

function setup(
  requests = 2,
  listenerEvent: 'afterOutputKnockDown' | 'outputKnockDown' = 'afterOutputKnockDown',
) {
  const elapsed = vi.fn((control: OrdinaryKnockDownRuntime) => control.exit());
  const environment = new StandardPlayerDamageEnvironment({
    criticalSamples: { nextCriticalSample: () => 1 },
    resolveNonRandomRuntimeSnapshot: () => ({
      runtimeExtensionMultiplier: 1,
      appliesIgniteDamageMultiplier: false,
      appliesPhysicalInflictionDamageMultiplier: false,
    }),
    enemyVitals: createEnemyCombatVitals(enemy),
    tagRegistry: gameplayTagRegistry,
    // 此测试闭包没有起身读者，显式选择到期退出；不作为任意生成闭包的默认策略。
    knockDown: {
      predefine: new GameplayTagPredefine(GAMEPLAY_TAG_PREDEFINE),
      onDurationElapsed: elapsed,
    },
  });
  const apply = (buffId: string) => ({
    kind: 'applyBuff' as const,
    parameters: { buffId, target: 'caster' as const, inheritSourceSkillCastInfo: true },
  });
  // 使用契约编译和真实 Buff 生命周期；这是流程夹具，不冒充原生物理 Buff 的数值。
  const buffDefinitions = compileOperatorBuffDefinitions({
    buff_physical_no_guard: { stackingType: 'refresh', durationSeconds: 9 },
    buff_physical_knockdown: { stackingType: 'refresh', durationSeconds: 9 },
    listener: {
      stackingType: 'unique',
      abilityEventResponses: [
        {
          event: listenerEvent,
          priority: 0,
          sequence: { steps: [apply('talent-result')] },
        },
      ],
    },
    'talent-result': { stackingType: 'unique' },
  });
  const program: CompiledSkillProgram = {
    operatorId: 'operator',
    skillId: 'down',
    skillGroupKey: 'battleSkill',
    skillType: 'battleSkill',
    skillLevel: 1,
    initialBlackboard: {},
    timelineBlockFrames: 1,
    costs: [],
    timelineActions: [
      {
        startFrame: 0,
        sequence: {
          steps: Array.from({ length: requests }, () => ({
            kind: 'applyKnockDown' as const,
            parameters: {
              target: 'enemy' as const,
              duration: { kind: 'constant' as const, value: 1.5 },
              force: false,
              isExtra: false,
              targetFilter: 'aliveOnly' as const,
              returnWhen: 'always' as const,
            },
          })),
        },
      },
    ],
  };
  let control!: OrdinaryKnockDownRuntime;
  const assembly = new CombatRuntimeAssembly({
    ...environment.runtimeOptions,
    enemy,
    bindBattleRuntime: context => {
      const bound = environment.runtimeOptions.bindBattleRuntime!(context)!;
      control = bound.enemyControlRuntime as OrdinaryKnockDownRuntime;
      return bound;
    },
    timeDilation: { config: {} },
    resources: {
      sp: 0,
      maxSp: 300,
      returnedSp: 0,
      sharedSpGain: { baseGainEfficiency: 1 },
      spRecovery: { valuePerSecond: 0, pauseDuration: 0, pauseRemaining: 0 },
      ultimateEnergySystemUnlocked: false,
      normalSkillUltimateEnergy: { selfGainPerSp: 0, otherGainPerSp: 0 },
      squad: [],
    },
    operators: [
      {
        operatorId: 'operator',
        skills: [program],
        buffDefinitions,
        panel: {
          operatorId: 'operator',
          level: 1,
          attributes: { strength: 0, agility: 0, intellect: 0, will: 0 },
          attack: 100,
          attackBeforeAttributeScalar: 100,
          mainAttribute: 'strength',
          secondaryAttribute: 'will',
          health: 1000,
          defense: 0,
          criticalRate: 0,
          criticalDamage: 0,
          artsIntensity: 0,
          ultimateEnergyGainEfficiency: 1,
          skillCooldownReduction: 0,
          staggerDamagePercent: 0,
          combatModifiers: [],
          receipt: [],
        },
        passivePrograms: [
          {
            key: 'listener',
            initialBlackboard: {},
            enableSequence: { steps: [apply('listener')] },
          },
        ],
      },
    ],
  });
  const operatorBuffs = environment.runtimeOptions.createOperatorBuffRuntime!(
    'operator',
  ) as BuffDefinitionOperationTarget<string>;
  return {
    assembly,
    environment,
    control,
    operatorBuffs,
    elapsed,
    start: () => expect(assembly.tryStartSkill('operator', 'down')).toBe(true),
  };
}

describe('标准战斗环境的普通倒地显式装配', () => {
  it.each(['afterOutputKnockDown', 'outputKnockDown'] as const)(
    '%s Buff 在真实组件原始击倒通知上响应，旧筛选不二次发布',
    listenerEvent => {
      const s = setup(2, listenerEvent);
      const raw: unknown[] = [];
      const filtered: unknown[] = [];
      s.environment
        .eventsFor('operator')
        .registerAction('afterOutputKnockDown', 1, event => raw.push(event));
      s.assembly.semanticEvents.register({
        ownerOperatorId: 'operator',
        trigger: { kind: 'knockDownOutput' },
        phase: 'dataAction',
        priority: 0,
        handle: context => filtered.push(context.event),
      });
      const emit = vi.spyOn(s.assembly.semanticEvents, 'emit');
      s.start();
      expect(raw).toHaveLength(1);
      expect(filtered).toHaveLength(1);
      expect(filtered[0]).toBe(raw[0]);
      expect(s.operatorBuffs.getCountByIds(['talent-result'])).toBe(1);
      expect(emit.mock.calls.some(([event]) => event.kind === 'knockDownOutput')).toBe(false);
    },
  );

  it('第一次只破防，不触发专属事件或天赋响应', () => {
    const s = setup(1);
    const after = vi.fn();
    s.environment.eventsFor('operator').registerAction('afterOutputKnockDown', 1, after);
    s.start();
    expect(
      s.environment.runtimeOptions.enemyBuffRuntime.getCountByIds(['buff_physical_no_guard']),
    ).toBe(1);
    expect(s.control.active).toBe(false);
    expect(after).not.toHaveBeenCalled();
    expect(s.operatorBuffs.getCountByIds(['talent-result'])).toBe(0);
  });

  it('第二次倒地复用同一标签容器，并在专属事件时同步执行天赋而非通用 After 之后', () => {
    const s = setup();
    const trace: string[] = [];
    for (const event of [
      'beforeOutputKnockDown',
      'afterOutputKnockDown',
      'afterOutputPhysicalInfliction',
    ] as const) {
      s.environment.eventsFor('operator').registerAction(event, -1, ({ payload }) => {
        trace.push(event);
        expect(payload).toMatchObject({
          sourceId: 'operator',
          targetId: 'enemy',
          fromAirborne: false,
        });
        if (event === 'afterOutputKnockDown')
          expect(s.operatorBuffs.getCountByIds(['talent-result'])).toBe(1);
      });
    }
    s.start();
    expect(trace).toEqual([
      'beforeOutputKnockDown',
      'afterOutputKnockDown',
      'afterOutputPhysicalInfliction',
    ]);
    expect(
      s.environment.runtimeOptions.enemyBuffRuntime.matchesEntityTags([DOWN_TAG], 'hasAll'),
    ).toBe(true);
    expect(s.control.remaining).toBe(1.5);
    s.assembly.advanceFrames(46);
    expect(s.elapsed).toHaveBeenCalledOnce();
    expect(s.control.active).toBe(false);
    expect(
      s.environment.runtimeOptions.enemyBuffRuntime.matchesEntityTags([DOWN_TAG], 'hasAll'),
    ).toBe(false);
    // 控制时长不得覆盖状态 Buff 的独立寿命。
    expect(
      s.environment.runtimeOptions.enemyBuffRuntime.getCountByIds(['buff_physical_knockdown']),
    ).toBe(1);
  });

  it('实体时钟乘全局与自身倍率，不跟随默认 Buff 时钟', () => {
    const s = setup();
    s.start();
    s.assembly.timeDilation!.startGlobal({
      durationSeconds: 10,
      slot: 'Test/Global',
      priority: 1,
      constantScale: 0.5,
    });
    s.assembly.timeDilation!.startEntity({
      entityId: 'enemy',
      durationSeconds: 10,
      slot: 'Test/Entity',
      priority: 1,
      curve: () => 0.4,
    });
    s.assembly.advanceFrames(30);
    expect(s.control.remaining).toBeCloseTo(1.3, 5);
    expect(s.elapsed).not.toHaveBeenCalled();
  });

  it('全局冻屏同时暂停倒地控制计时与默认 Buff 寿命', () => {
    const s = setup();
    s.start();
    s.assembly.timeDilation!.startGlobal({
      durationSeconds: 20,
      slot: 'Test/Freeze',
      priority: 1,
      constantScale: 0,
    });
    s.assembly.advanceFrames(300);
    expect(s.control.remaining).toBe(1.5);
    expect(
      s.environment.runtimeOptions.enemyBuffRuntime.getCountByIds(['buff_physical_knockdown']),
    ).toBe(1);
    expect(
      s.environment.runtimeOptions.enemyBuffRuntime.matchesEntityTags([DOWN_TAG], 'hasAll'),
    ).toBe(true);
  });

  it('来源时长属性默认 0，组件 Before 中修改后由同一属性集即时读取', () => {
    const s = setup();
    const attributes = s.operatorBuffs.container.attributes;
    expect(attributes.get('KnockDownTimeAddition')).toBe(0);
    s.environment.eventsFor('operator').registerAction('beforeOutputKnockDown', 0, () => {
      attributes.addModifier(
        createCombatAttributeModifier(
          'KnockDownTimeAddition',
          attributeModifierValues('baseAddition', 2),
          ATTRIBUTE_MODIFIER_SOURCES.buff,
          'deck',
        ),
      );
    });
    s.start();
    expect(s.control.remaining).toBe(3.5);
  });

  it('不同模拟不共享控制计时、标签或天赋 Buff', () => {
    const first = setup();
    const second = setup();
    first.start();
    expect(second.control.active).toBe(false);
    expect(second.operatorBuffs.getCountByIds(['talent-result'])).toBe(0);
    expect(
      second.environment.runtimeOptions.enemyBuffRuntime.matchesEntityTags([DOWN_TAG], 'hasAll'),
    ).toBe(false);
    second.assembly.advanceFrames(90);
    expect(first.control.remaining).toBe(1.5);
  });

  it.each(['beforeOutputKnockDown', 'afterOutputKnockDown'] as const)(
    '%s 载荷必须明确声明是否由浮空转入',
    event => {
      const missing = { event, payload: { sourceId: 'operator', targetId: 'enemy' } };
      const valid = {
        event,
        payload: { sourceId: 'operator', targetId: 'enemy', fromAirborne: false },
      };
      if (false) {
        // @ts-expect-error 分类读取器不接收缺失 fromAirborne 的伪造事件。
        knockDownAbilityEvent(missing);
      }
      expect(knockDownAbilityEvent(valid)).toEqual({
        event,
        payload: { sourceId: 'operator', targetId: 'enemy', fromAirborne: false },
      });
    },
  );
});
