import { extractGraphDataNodes } from '../../../../tools/game-data-compiler/src/compiler/extractGraphDataNodes';
import { createKillEvent } from '../events/killEventTestFixture';
import { describe, expect, it, vi } from 'vitest';
import { parseKnownNativeActionSequenceSource } from '../../../../tools/game-data-compiler/src/source/actionLeaf.ts';
import { compileCombatConditionSequenceSource } from '../../../../tools/game-data-compiler/src/compiler/buffs/buffRuntimeProjection.ts';
import {
  scalarFixture,
  targetFixture,
} from '../../../../tools/game-data-compiler/test/sourceFixtures.ts';
import { createActionGraphCompilation } from '../../compiler/compileActionGraph';
import { createActionGraphBuilder } from '../../../../tools/game-data-compiler/src/compiler/actions/actionGraphBuilder.ts';
import type { CompiledBuffStepSource } from '../../../../tools/game-data-compiler/src/compiler/actions/combatActionProjectionTypes.ts';
import type { ActionGraphNode } from '../../../../packages/game-data-contract/src/actionGraph';
import type { ResolvedActionSequence } from '../../compiler/combatProgram';
import { CombatAttributeSet } from '../attributes/combatAttributes';
import { CombatBuffContainer, type CombatBuffDefinition } from '../buffs/combatBuffs';
import { PlayerDamageContext, type PlayerDamageAttributeSnapshots } from './playerDamageContext';
import {
  DAMAGE_SCALE_ATTRIBUTE_KEYS,
  type DamageScaleAttributeSnapshot,
} from './damageScaleAttributes';
import type { DamageTag } from '../../game-data/operatorDefinition';
import { ActionBlackboardOperationExecutor } from '../actions/actionBlackboardOperationExecutor';
import { EventContextConditionExecutor } from '../events/eventContextConditionExecutor';
import { CombatActionSequenceRuntime } from '../actions/combatActionSequenceRuntime';
import { createDamageModifierCondition } from './damageModifierSequenceRuntime';
import type { CombatOperationContext } from '../skills/skillRuntime';
import { ActionBlackboard } from '../actions/actionBlackboard';
import lastRite from '../../../data/operators/last-rite.generated';

it('别礼正式战技条件：潜能、主控、重击缺一不可，连续命中与切面恢复一致', () => {
  const buff = lastRite.buffDefinitions!.buff_chr_0026_lastrite_normal_skill!;
  if (!buff.actionGraph) throw new Error('战技 Buff 缺少动作图');
  const reference = buff.damageModifiers![0]!.condition!;
  const sequence = createActionGraphCompilation(
    buff.actionGraph,
    12,
    'last-rite-condition',
  ).compileEntry(reference, 'damage-condition');
  for (const potential of [0, 1])
    for (const controlled of [false, true]) {
      const operations = new ActionBlackboardOperationExecutor(
        new EventContextConditionExecutor({
          execute: () => {
            throw new Error('条件不应执行外部操作');
          },
          evaluate(check) {
            if (check.kind !== 'casterControlled')
              throw new Error(`unexpected condition ${check.kind}`);
            return controlled;
          },
        }),
      );
      const create = (state?: import('../state/actionState').ActionSequenceState) =>
        createDamageModifierCondition(
          sequence,
          new CombatActionSequenceRuntime(operations, {
            blackboard: new ActionBlackboard({ potential_1: potential }),
          }),
          {},
          state,
        );
      const condition = create();
      expect(condition.summary).toEqual({
        requirements: ['casterControlled', 'heavyAttack'],
        partial: true,
      });
      for (const heavy of [false, true, false, true]) {
        const input = {
          side: 'attacker' as const,
          sourceId: 'last-rite',
          targetId: 'enemy',
          skillCastId: 1,
          damageType: 'cryo' as const,
          tags: heavy ? ['normalAttackLastCombo' as const] : ['normalAttack' as const],
          features: [],
        };
        const saved = structuredClone(condition.runtimeState);
        const expected = potential === 1 && controlled && heavy;
        expect(condition.execute(input), `${potential}/${controlled}/${heavy}`).toBe(expected);
        const restored = create(saved);
        expect(restored.execute(input)).toBe(expected);
        expect(restored.runtimeState).toEqual(condition.runtimeState);
      }
    }
});

// 对应当前 skillimbue 条件结构；走正式原生解析、公共投影和技能程序编译，不手写等价 JS 分支。
const compileGraphEntry = (
  revision: string,
  entry: string | null,
  nodes: Record<string, ActionGraphNode>,
): ResolvedActionSequence => ({
  graph: createActionGraphCompilation({ nodes }, 1, revision).compileAll(),
  entry,
  callSite: revision,
});

/** 工具投影直接构建图节点；测试用同一构建器收集节点后再编译，不自写转换。 */
const compileDomainSequence = (
  revision: string,
  source: Parameters<typeof compileCombatConditionSequenceSource>[0],
): ResolvedActionSequence => {
  const builder = createActionGraphBuilder<CompiledBuffStepSource>();
  const reference = compileCombatConditionSequenceSource(source, {
    graph: builder,
    modifierContext: 'damage',
    actionOwnerTarget: 'buffOwner',
    actionSourceTarget: 'caster',
    actionTargetTarget: 'enemy',
    fixedBuffOwnerTarget: 'caster',
    fixedBuffSourceTarget: 'caster',
  });
  return {
    graph: createActionGraphCompilation(
      extractGraphDataNodes(builder.finish()),
      1,
      revision,
    ).compileAll(),
    entry: reference.$sequence,
    callSite: revision,
  };
};

function sourceProgram() {
  const action = (name: string, fields = {}) => ({
    $type: `Beyond.Gameplay.Core.${name}, Gameplay.Beyond`,
    isEnable: true,
    priorityLevel: 'Default',
    priorityOffset: 0,
    serverActionIndex: 0,
    ...fields,
  });
  const sequence = (...actionData: unknown[]) => ({
    actionData,
    onlyExecuteWhenSourceIsMainChar: false,
    onlyExecuteWhenSourceIsGuard: false,
  });
  const mask = (value: number) =>
    action('Conditions.CheckDamageDecorateMask+Data', { checkType: 'HasAny', mask: value });
  return compileDomainSequence(
    'modifier.condition',
    parseKnownNativeActionSequenceSource(
      sequence(
        action('Conditions.CheckSkillCastId+Data'),
        mask(768),
        action('IfElseAction+IfElseActionData', {
          conditionAction: sequence(mask(256)),
          alwaysNext: true,
          succeedActions: sequence(
            action('SimpleCalcBBAction+Data', {
              key: 'real_imbue_scale',
              operation: 'Multiply',
              value1: scalarFixture(0, 'imbue_scale'),
              value2: scalarFixture(1.5),
            }),
          ),
          failActions: sequence(
            action('ModifyDynamicBlackboard+Data', {
              key: 'real_imbue_scale',
              operation: 'Assign',
              directValue: true,
              value: scalarFixture(0, 'imbue_scale'),
              calculationTarget: targetFixture('Owner'),
              calculateType: 'HpRatio',
            }),
          ),
        }),
      ),
      'modifier.condition',
      {},
    ),
  );
}

const scales = Object.fromEntries(
  DAMAGE_SCALE_ATTRIBUTE_KEYS.map(key => [key, 0]),
) as unknown as DamageScaleAttributeSnapshot;
const snapshots: PlayerDamageAttributeSnapshots = {
  attacker: {
    ...scales,
    attack: 100,
    criticalRate: 0,
    criticalDamageIncrease: 0,
    weaknessDamageMultiplier: 1,
    igniteDamageMultiplier: 1,
    physicalInflictionDamageMultiplier: 1,
  },
  defender: {
    ...scales,
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
};

function fixture(
  options: {
    getAffix?: () => number | null;
    bindBuffAffix?: boolean;
    emptyProcessors?: boolean;
    missingValue?: boolean;
  } = {},
) {
  const owner = new CombatBuffContainer<never>('operator', new CombatAttributeSet<never>());
  const contexts: CombatOperationContext[] = [];
  const resolveTarget = vi.fn((id: string) =>
    id === 'enemy'
      ? { kind: 'enemy' as const, enemyId: id }
      : { kind: 'operator' as const, operatorId: id },
  );
  const createCondition = vi.fn((buff: NonNullable<ReturnType<typeof owner.add>>) => {
    const delegate = {
      execute: () => {
        throw Error('unexpected operation');
      },
      evaluate: () => {
        throw Error('unexpected condition');
      },
    };
    const operations = new ActionBlackboardOperationExecutor(
      new EventContextConditionExecutor(delegate),
    );
    const runtime = new CombatActionSequenceRuntime(
      {
        execute: (step, context) => {
          if (context) contexts.push({ ...context });
          return operations.execute(step, context);
        },
        evaluate: (condition, context) => operations.evaluate(condition, context),
      },
      {
        blackboard: buff.blackboard,
        skillCastInfo: buff.skillCastInfo ?? undefined,
        buffOwnerId: buff.owner.ownerId,
        buffSourceId: buff.sourceId,
        // 预先存在的外部事件不能泄漏到 Modifier 的同步上下文。
        event: {
          event: 'outputDamage' as const,
          payload: {
            ...createKillEvent().payload,
            sourceId: 'old',
            targetId: 'old',
            tags: ['ultimateSkill'],
            features: [],
          },
        },
      },
    );
    return createDamageModifierCondition(sourceProgram(), runtime, {
      getBuffAffixSkillCastId: options.bindBuffAffix
        ? () => buff.affixSkillCastId
        : options.getAffix,
      resolveInputTarget: resolveTarget,
    });
  });
  const definition: CombatBuffDefinition<never> = {
    id: 'imbue',
    stackingType: 'unlimited',
    blackboard: { ...(options.missingValue ? {} : { imbue_scale: 0.5 }), real_imbue_scale: 9 },
    damageModifiers: [
      {
        enabledSide: 'attacker',
        createCondition,
        processors: options.emptyProcessors
          ? []
          : [
              {
                kind: 'damageScale',
                side: 'attacker',
                zone: 'combo',
                addition: { blackboardKey: 'real_imbue_scale' },
              },
            ],
      },
    ],
  };
  const add = () => {
    const buff = owner.add(definition, 'operator', {
      skillCastInfo: {
        skillCastId: 999,
        originSkillId: 'ordinary-source',
        originSkillType: 'battleSkill',
        nonReturnedSpCost: 0,
      },
    });
    if (buff === null) throw Error('fixture buff rejected');
    return buff;
  };
  const buff = add();
  const pack = (
    tags: readonly DamageTag[],
    skillCastId = 42,
    sourceId = 'operator',
    targetId = 'enemy',
  ) =>
    new PlayerDamageContext({
      sourceId,
      targetId,
      skillCastId,
      tags,
      damageType: 'physical',
      targetHealthType: 'normal',
      ports: {
        captureAttributeSnapshots: () => snapshots,
        applyModifiers: (timing, side, input) => owner.applyDamageModifiers(timing, side, input),
        addInstantAttributeModifier: () => undefined,
        clearInstantAttributeModifiers: () => undefined,
      },
    });
  return { owner, buff, add, pack, contexts, resolveTarget, createCondition };
}

describe('Buff 同步伤害条件程序', () => {
  it('伤害类型摘要保留类型名称，但不能把忽略条件结果的分支显示为类型限制', () => {
    const compilation = (alwaysNext: boolean) =>
      createActionGraphCompilation(
        {
          nodes: {
            guard: {
              action: {
                kind: 'conditional',
                parameters: { condition: { kind: 'conditionNode', nodeId: 'type' }, alwaysNext },
                whenTrue: { $sequence: null },
              },
              next: null,
            },
          },
          dataNodes: {
            type: {
              type: 'boolean',
              expression: { kind: 'eventDamageTypeIn', damageTypes: ['cryo'] },
            },
          },
        },
        1,
        'type-summary',
      );
    const runtime = new CombatActionSequenceRuntime(
      new EventContextConditionExecutor({
        execute: () => true,
        evaluate: () => {
          throw new Error('unexpected condition');
        },
      }),
      { blackboard: new ActionBlackboard() },
    );
    const create = (alwaysNext: boolean) =>
      createDamageModifierCondition(
        {
          graph: compilation(alwaysNext).compileAll(),
          entry: 'guard',
          callSite: 'type-summary',
        },
        runtime,
      );
    const restricted = create(false);
    const unrestricted = create(true);
    const input = {
      side: 'attacker' as const,
      sourceId: 'operator',
      targetId: 'enemy',
      skillCastId: null,
      damageType: 'physical' as const,
      tags: [],
      features: [],
    };
    expect(restricted.damageTypes).toEqual(['cryo']);
    expect(restricted.execute(input)).toBe(false);
    expect(restricted.execute({ ...input, damageType: 'cryo' })).toBe(true);
    expect(unrestricted.damageTypes).toBeUndefined();
    expect(unrestricted.execute(input)).toBe(true);
  });

  it('从实例读取独立 affix 状态，普通来源相同也不能通过未登记门禁', () => {
    const f = fixture({ bindBuffAffix: true });
    expect(f.buff.affixSkillCastId).toBe(0);
    f.pack(['normalSkill'], 999).applyModifiers('afterCalculation');
    expect(f.buff.blackboard.getNumber('real_imbue_scale')).toBe(9);
    f.buff.recordBuffAffixSkillCastId(42);
    const damage = f.pack(['normalSkill']);
    damage.setCalculationResult(100);
    expect(damage.resolveFinalAttackValue()).toBe(175);
    expect(f.buff.skillCastInfo?.skillCastId).toBe(999);

    const other = f.add();
    expect(other.affixSkillCastId).toBe(0);
    f.buff.recordBuffAffixSkillCastId(43);
    f.buff.blackboard.assign({ real_imbue_scale: 9 });
    f.pack(['normalSkill'], 42).applyModifiers('afterCalculation');
    expect(f.buff.blackboard.getNumber('real_imbue_scale')).toBe(9);
    f.buff.finish('other');
    // 原生 Action.OnEnd 不清这个字段；新 Buff（原生池 Reset）才从 0 开始。
    expect(f.buff.affixSkillCastId).toBe(43);
    expect(f.add().affixSkillCastId).toBe(0);
  });

  it.each([-1, 1.5, Number.NaN, Number.POSITIVE_INFINITY, 0x100000000])(
    '记录非法 affix %s 时保留原值',
    value => {
      const f = fixture({ bindBuffAffix: true });
      f.buff.recordBuffAffixSkillCastId(42);
      expect(() => f.buff.recordBuffAffixSkillCastId(value)).toThrow('UInt32');
      expect(f.buff.affixSkillCastId).toBe(42);
    },
  );

  it('affix 编号接受 UInt32 边界和显式清零，不影响普通来源', () => {
    const f = fixture({ bindBuffAffix: true });
    f.buff.recordBuffAffixSkillCastId(0xffffffff);
    expect(f.buff.affixSkillCastId).toBe(0xffffffff);
    f.buff.recordBuffAffixSkillCastId(0);
    expect(f.buff.affixSkillCastId).toBe(0);
    expect(f.buff.skillCastInfo?.skillCastId).toBe(999);
  });

  it('防御方条件绑定攻击者 InputTarget，结束后不覆盖 Buff 原环境', () => {
    const original: CombatOperationContext = {
      blackboard: new ActionBlackboard(),
      actionInputTarget: { kind: 'operator', operatorId: 'old' },
      event: {
        event: 'outputDamage' as const,
        payload: {
          ...createKillEvent().payload,
          sourceId: 'old',
          targetId: 'old',
          tags: [],
          features: [],
        },
      },
    };
    let observed: CombatOperationContext | undefined;
    const runtime = new CombatActionSequenceRuntime(
      {
        execute: () => true,
        evaluate: (_condition, context) => {
          observed = context && { ...context };
          return true;
        },
      },
      original,
    );
    const program = createDamageModifierCondition(
      compileGraphEntry('defender-input-target', 'step-0', {
        'step-0': {
          action: {
            kind: 'conditional',
            parameters: { condition: { kind: 'constant', value: true } },
            whenTrue: { $sequence: null },
          },
          next: null,
        },
      }),
      runtime,
      { resolveInputTarget: operatorId => ({ kind: 'operator', operatorId }) },
    );
    expect(
      program.execute({
        side: 'defender',
        sourceId: 'attacker',
        targetId: 'enemy',
        skillCastId: 1,
        damageType: 'physical',
        tags: [],
        features: [],
      }),
    ).toBe(true);
    expect(observed?.actionInputTarget).toEqual({ kind: 'operator', operatorId: 'attacker' });
    expect(observed?.event).toBeUndefined();
    expect(original.actionInputTarget).toEqual({ kind: 'operator', operatorId: 'old' });
    expect(original.event).toMatchObject({ payload: { sourceId: 'old' } });
    expect(original.modifierContext).toBeUndefined();
  });

  it.each([
    [['normalSkill'], 42, 175, 0.75],
    [['ultimateSkill'], 42, 150, 0.5],
    [['normalSkill', 'ultimateSkill'], 42, 175, 0.75],
    [['normalAttack'], 42, 100, 9],
    [['normalSkill'], 41, 100, 9],
    [['normalSkill'], 999, 100, 9],
  ] as const)(
    '原生来源条件 %j / cast %i 得到伤害 %i',
    (tags, cast, expectedDamage, expectedValue) => {
      const f = fixture({ getAffix: () => 42 });
      const damage = f.pack(tags, cast);
      damage.applyModifiers('beforeCalculation');
      damage.setCalculationResult(100);
      expect(damage.resolveFinalAttackValue()).toBe(expectedDamage);
      expect(f.buff.blackboard.getNumber('real_imbue_scale')).toBe(expectedValue);
      expect(f.createCondition).toHaveBeenCalledTimes(1);
    },
  );

  it('前阶段先写值，后阶段重新读取，下一包重新分支；写入归 Buff 而非临时技能', () => {
    const f = fixture({ getAffix: () => 42 });
    const first = f.pack(['normalSkill']);
    first.applyModifiers('beforeCalculation');
    expect(f.buff.blackboard.getNumber('real_imbue_scale')).toBe(0.75);
    expect(first.damageScales.getFinalValue()).toBe(1);
    f.buff.blackboard.assign({ imbue_scale: 0.25 });
    first.setCalculationResult(100);
    expect(first.resolveFinalAttackValue()).toBe(137.5);
    const second = f.pack(['ultimateSkill']);
    second.setCalculationResult(100);
    expect(second.resolveFinalAttackValue()).toBe(125);
    expect(
      f.contexts.every(
        context => context.blackboard === f.buff.blackboard && context.event === undefined,
      ),
    ).toBe(true);
    expect(f.contexts.at(-1)?.skillCastInfo?.skillCastId).toBe(999);
    const observed = f.contexts.at(-1)?.modifierContext;
    expect(observed?.kind === 'damage' ? observed.input.skillCastId : undefined).toBe(42);
    expect(f.resolveTarget).toHaveBeenCalledWith('enemy');
  });

  it('空处理器仍执行条件，并随 Buff 结束注销', () => {
    const f = fixture({ getAffix: () => 42, emptyProcessors: true });
    const damage = f.pack(['normalSkill']);
    damage.applyModifiers('afterCalculation');
    expect(f.buff.blackboard.getNumber('real_imbue_scale')).toBe(0.75);
    expect(damage.damageScales.getFinalValue()).toBe(1);
    f.buff.finish('other');
    f.buff.blackboard.assign({ real_imbue_scale: 9 });
    f.pack(['normalSkill']).applyModifiers('afterCalculation');
    expect(f.buff.blackboard.getNumber('real_imbue_scale')).toBe(9);
  });

  it('不同实例不共用黑板；相同伤害包按两个实例分别求值', () => {
    const f = fixture({ getAffix: () => 42 });
    const other = f.add();
    other.blackboard.assign({ imbue_scale: 0.25 });
    const damage = f.pack(['normalSkill']);
    damage.setCalculationResult(100);
    expect(damage.resolveFinalAttackValue()).toBe(212.5);
    expect(f.buff.blackboard.getNumber('real_imbue_scale')).toBe(0.75);
    expect(other.blackboard.getNumber('real_imbue_scale')).toBe(0.375);
    expect(f.createCondition).toHaveBeenCalledTimes(2);
  });

  it('未知 affix 不回退普通 SkillCastInfo，缺值错误后可在新调用恢复', () => {
    const unknown = fixture();
    expect(() => unknown.pack(['normalSkill'], 999).applyModifiers('afterCalculation')).toThrow(
      'explicit Buff affix',
    );
    const f = fixture({ getAffix: () => 42, missingValue: true });
    // 不同施法在读取缺失值前短路。
    expect(() => f.pack(['normalSkill'], 41).applyModifiers('afterCalculation')).not.toThrow();
    expect(() => f.pack(['normalSkill']).applyModifiers('afterCalculation')).toThrow('imbue_scale');
    f.buff.blackboard.assign({ imbue_scale: 0.5 });
    const damage = f.pack(['ultimateSkill']);
    damage.setCalculationResult(100);
    expect(damage.resolveFinalAttackValue()).toBe(150);
  });

  it.each([0, null])('明确无效的 affix %s 返回 false', value => {
    const f = fixture({ getAffix: () => value });
    f.pack(['normalSkill'], 0).applyModifiers('afterCalculation');
    expect(f.buff.blackboard.getNumber('real_imbue_scale')).toBe(9);
  });

  it.each([-1, 1.5, Number.NaN, 0x100000000])('无效的编号输入 %s 不能参与比较', value => {
    const f = fixture({ getAffix: () => value });
    expect(() => f.pack(['normalSkill']).applyModifiers('afterCalculation')).toThrow('UInt32');
  });

  it('侧别/实体门禁位于条件之前，不对其他实体读取未绑定的 affix', () => {
    const f = fixture();
    expect(() =>
      f.pack(['normalSkill'], 42, 'other').applyModifiers('afterCalculation'),
    ).not.toThrow();
    expect(() =>
      f.pack(['normalSkill'], 42, 'other', 'operator').applyModifiers('afterCalculation'),
    ).not.toThrow();
  });
});
