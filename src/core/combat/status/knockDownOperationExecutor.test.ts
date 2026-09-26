import { describe, expect, it, vi } from 'vitest';
import type { CombatStepParameters } from '../../../../packages/game-data-contract/src/actions';
import { CombatAttributeSet } from '../attributes/combatAttributes';
import { CombatBuffContainer, type CombatBuffDefinition } from '../buffs/combatBuffs';
import { GameplayTagPredefine } from '../tags/gameplayTagPredefine';
import { GAMEPLAY_TAG_PREDEFINE } from '../../../data/combat/gameplayTagPredefine.generated';
import { ActionBlackboard } from '../actions/actionBlackboard';
import { BuffDefinitionOperationTarget } from '../buffs/buffDefinitionOperationTarget';
import { OrdinaryKnockDownRuntime } from './ordinaryKnockDownRuntime';
import {
  KnockDownOperationExecutor,
  type KnockDownAbilityEvent,
} from './knockDownOperationExecutor';
import type { CombatOperationContext } from '../skills/skillRuntime';
import { chainEntry } from '../../../test/compiledGraphEntry';
import { CombatActionSequenceRuntime } from '../actions/combatActionSequenceRuntime';
import { validateSkillDefinition } from '../../game-data/validateSkillDefinition';
import { inspectStandardPlayerDamageCompatibility } from '../runtime/standardPlayerDamageCompatibility';

const NO_GUARD = 'buff_physical_no_guard';
const DOWN_BUFF = 'buff_physical_knockdown';
const DOWN_TAG = 'Status/Immobilized/KnockDown';
const INTERRUPTED_TAG = 'Status/SkillCast/WeaknessInterrupted';
const step = (overrides: Partial<CombatStepParameters['applyKnockDown']> = {}) => ({
  kind: 'applyKnockDown' as const,
  parameters: {
    target: 'enemy' as const,
    duration: { kind: 'constant' as const, value: 1.5 },
    force: false,
    isExtra: false,
    targetFilter: 'aliveOnly' as const,
    returnWhen: 'always' as const,
    ...overrides,
  },
});

function setup() {
  const trace: string[] = [];
  const context: CombatOperationContext = {
    blackboard: new ActionBlackboard({ duration: 1.5 }),
    skillCastInfo: {
      skillCastId: 1,
      originSkillId: 'battle',
      originSkillType: 'battleSkill',
      nonReturnedSpCost: 0,
    },
  };
  let onEvent = (_event: KnockDownAbilityEvent) => {};
  let onBuff = (_id: string) => {};
  let alive = true;
  let addition = 0;
  const predefine = new GameplayTagPredefine(GAMEPLAY_TAG_PREDEFINE);
  const container = new CombatBuffContainer('enemy', new CombatAttributeSet<string>());
  const definitions = new Map<string, CombatBuffDefinition<string>>(
    [NO_GUARD, DOWN_BUFF].map(id => [
      id,
      {
        id,
        stackingType: 'refresh',
        durationSeconds: 9,
        blackboard: { duration: 9 },
        actions: {
          start: () => {
            trace.push(`buff:${id}`);
            onBuff(id);
          },
        },
      },
    ]),
  );
  const target = new BuffDefinitionOperationTarget(container, { get: id => definitions.get(id) });
  // 测试显式声明无起身读者，到期直接退出；不是生产默认值或原生起身时长。
  const control = new OrdinaryKnockDownRuntime(container, predefine, runtime => runtime.exit());
  const getControl = vi.fn((): OrdinaryKnockDownRuntime | null => control);
  const readAddition = vi.fn(() => {
    trace.push('readAddition');
    return addition;
  });
  const onControlApplied = vi.fn(() => {
    trace.push('controlApplied');
  });
  const delegate = {
    execute: vi.fn(() => {
      trace.push('next');
      return true;
    }),
    evaluate: vi.fn(() => true),
    prepare: vi.fn(),
    end: vi.fn(),
  };
  const executor = new KnockDownOperationExecutor({
    sourceId: 'ember',
    target,
    isTargetAlive: () => alive,
    predefine,
    getControl,
    readSourceDurationAddition: readAddition,
    resolveBuffDefinition: () => undefined,
    emit: (event, payload) => {
      expect(payload.sourceId).toBe('ember');
      expect(payload.targetId).toBe('enemy');
      expect(payload.skillCastInfo).toBe(context.skillCastInfo);
      trace.push(event);
      onEvent(event);
    },
    onNoGuard: () => trace.push('noGuardRecorded'),
    onControlApplied,
    onPhysicalInflictionApplied: () => trace.push('physicalInflictionApplied'),
    delegate,
  });
  return {
    trace,
    context,
    container,
    target,
    control,
    executor,
    getControl,
    readAddition,
    delegate,
    onControlApplied,
    onEvent: (callback: typeof onEvent) => {
      onEvent = callback;
    },
    onBuff: (callback: typeof onBuff) => {
      onBuff = callback;
    },
    setAlive: (value: boolean) => {
      alive = value;
    },
    setAddition: (value: number) => {
      addition = value;
    },
  };
}

describe('普通根倒地：复用真实 Buff 目标与控制标签', () => {
  it('恢复倒地计时后沿用剩余时间，到期只清理新分支的控制标签', () => {
    const original = setup();
    original.executor.execute(step(), original.context);
    original.executor.execute(step(), original.context);
    original.control.advance(0.1);
    const saved = structuredClone(original.control.runtimeState);
    const next = setup();
    // 本例只验证控制器恢复，实体标签作为另一份独立数据预先准备好。
    next.control.predefine.addTagIfNotHaving(next.container, 'KnockDown');
    const restored = new OrdinaryKnockDownRuntime(
      next.container,
      next.control.predefine,
      runtime => runtime.exit(),
      saved,
    );
    expect(restored.remaining).toBe(original.control.remaining);
    restored.advance(100);
    expect(restored.active).toBe(false);
    expect(original.control.active).toBe(true);
    expect(original.container.hasEntityTag(original.control.predefine.getTag('KnockDown'))).toBe(
      true,
    );
    expect(next.container.hasEntityTag(next.control.predefine.getTag('KnockDown'))).toBe(false);
  });

  it('第一次仅破防，第二次才进入普通倒地，控制时长不覆盖 Buff 自身时长', () => {
    const s = setup();
    expect(s.executor.execute(step(), s.context)).toBe(true);
    expect(s.trace).toEqual(['triggerDodge', `buff:${NO_GUARD}`, 'noGuardRecorded']);
    expect(s.control.active).toBe(false);
    s.trace.length = 0;
    expect(s.executor.execute(step({ returnWhen: 'success' }), s.context)).toBe(true);
    expect(s.trace).toEqual([
      'triggerDodge',
      'beforeOutputPhysicalInfliction',
      'beforeTakePhysicalInfliction',
      `buff:${DOWN_BUFF}`,
      'beforeTakeKnockDown',
      'beforeApplyPhysics',
      'beforeOutputKnockDown',
      'readAddition',
      'forceTriggerWeakness',
      'afterTakeKnockDown',
      'afterApplyPhysics',
      'afterOutputKnockDown',
      'controlApplied',
      'afterOutputPhysicalInfliction',
      'afterTakePhysicalInfliction',
      'physicalInflictionApplied',
    ]);
    expect(s.container.hasEntityTag(DOWN_TAG)).toBe(true);
    expect(s.control.remaining).toBe(1.5);
    const buff = s.container.findFirstByIds([DOWN_BUFF])!;
    expect(buff.blackboard.getNumber('duration')).toBe(9);
    expect(buff.remainingDuration).toBe(9);
    expect(buff.skillCastInfo).toEqual(s.context.skillCastInfo);
    expect(buff.sourceActionId).toBe('battle');
    s.control.advance(1.5);
    expect(s.container.hasEntityTag(DOWN_TAG)).toBe(false);
    expect(buff.remainingDuration).toBe(9);
  });

  it('强制倒地跳过破防门，但不跳过物理异常免疫', () => {
    const s = setup();
    const physicalImmunity = GAMEPLAY_TAG_PREDEFINE.immunityQueries.find(
      row => row.tag === 'Skill/Character/Common/PhysicalStatus/KnockdownStatus',
    )!.query.tags[0]!;
    s.container.addEntityTags([physicalImmunity]);
    expect(s.executor.execute(step({ force: true, returnWhen: 'success' }), s.context)).toBe(false);
    expect(s.trace).toEqual(['triggerDodge']);
    expect(s.target.getCountByIds([NO_GUARD, DOWN_BUFF])).toBe(0);
  });

  it('组件免疫不撤销已经施加的状态 Buff 或通用 After', () => {
    const s = setup();
    s.container.addEntityTags(['Immune/KnockDown']);
    expect(s.executor.execute(step({ force: true, returnWhen: 'success' }), s.context)).toBe(false);
    expect(s.target.getCountByIds([DOWN_BUFF])).toBe(1);
    expect(s.trace).toContain('beforeOutputKnockDown');
    expect(s.trace).not.toContain('afterOutputKnockDown');
    expect(s.trace.slice(-3)).toEqual([
      'afterOutputPhysicalInfliction',
      'afterTakePhysicalInfliction',
      'physicalInflictionApplied',
    ]);
    expect(s.control.active).toBe(false);
  });

  it('事件期间新增组件免疫也会被准入读取', () => {
    const s = setup();
    s.onEvent(event => {
      if (event === 'beforeOutputKnockDown') s.container.addEntityTags(['Immune/KnockDown']);
    });
    expect(s.executor.execute(step({ force: true, returnWhen: 'success' }), s.context)).toBe(false);
  });

  it('弱点回调新增免疫只阻止真正安装，仍返回成功并计时/发送 After', () => {
    const s = setup();
    s.onEvent(event => {
      if (event === 'forceTriggerWeakness') s.container.addEntityTags(['Immune/KnockDown']);
    });
    expect(s.executor.execute(step({ force: true, returnWhen: 'success' }), s.context)).toBe(true);
    expect(s.container.hasEntityTag(DOWN_TAG)).toBe(false);
    expect(s.control.remaining).toBe(1.5);
    expect(s.trace).toContain('afterOutputKnockDown');
  });

  it('缺控制组件不求值 duration，也不发送组件事件，但保留状态 Buff 和通用 After', () => {
    const s = setup();
    s.getControl.mockReturnValue(null);
    const action = step({
      force: true,
      returnWhen: 'success',
      duration: { kind: 'blackboard', key: 'missing' },
    });
    expect(s.executor.execute(action, s.context)).toBe(false);
    expect(s.readAddition).not.toHaveBeenCalled();
    expect(s.trace).not.toContain('beforeTakeKnockDown');
    expect(s.trace).toContain(`buff:${DOWN_BUFF}`);
    expect(s.trace.at(-1)).toBe('physicalInflictionApplied');
  });

  it('时长在状态 Buff 之后、组件 Before 之前读取；属性在组件 Before 之后、弱点事件之前读取', () => {
    const s = setup();
    s.onBuff(id => {
      if (id === DOWN_BUFF) s.context.blackboard.assignDynamic('duration', 2);
    });
    s.onEvent(event => {
      if (event === 'beforeOutputKnockDown') {
        s.context.blackboard.assignDynamic('duration', 7);
        s.setAddition(0.25);
      }
      if (event === 'forceTriggerWeakness') s.setAddition(10);
    });
    s.executor.execute(
      step({ force: true, duration: { kind: 'blackboard', key: 'duration' } }),
      s.context,
    );
    expect(s.control.remaining).toBe(2.25);
  });

  it('时长加成先转 float32，再进行 float32 加法', () => {
    const s = setup();
    s.setAddition(0.2);
    s.executor.execute(
      step({ force: true, duration: { kind: 'constant', value: 0.1 } }),
      s.context,
    );
    expect(s.control.remaining).toBe(Math.fround(Math.fround(0.1) + Math.fround(0.2)));
  });

  it.each([0, -2])('时长 %s 不会在下一帧被误作立即退出', duration => {
    const s = setup();
    s.executor.execute(
      step({ force: true, duration: { kind: 'constant', value: duration } }),
      s.context,
    );
    s.control.advance(10);
    expect(s.control.active).toBe(true);
    expect(s.control.remaining).toBe(0);
    expect(s.container.hasEntityTag(DOWN_TAG)).toBe(true);
  });

  it('重复倒地先退出、重新安装并重置时长；无免疫时标签不会积累', () => {
    const s = setup();
    s.executor.execute(step({ force: true }), s.context);
    s.control.advance(0.5);
    s.executor.execute(
      step({ force: true, duration: { kind: 'constant', value: 0.25 } }),
      s.context,
    );
    expect(s.control.remaining).toBe(0.25);
    // 根动作结束不拥有控制状态寿命，不能随原技能结束清除目标倒地。
    s.executor.end(step({ force: true }), s.context);
    expect(s.control.active).toBe(true);
    s.control.advance(0);
    expect(s.control.remaining).toBe(0.25);
    s.control.advance(0.25);
    expect(s.container.hasEntityTag(DOWN_TAG)).toBe(false);
  });

  it('控制器尾部回调可以退出；根动作不重新写回状态', () => {
    const s = setup();
    s.onControlApplied.mockImplementation(() => {
      s.control.exit();
    });
    expect(s.executor.execute(step({ force: true, returnWhen: 'success' }), s.context)).toBe(true);
    expect(s.control.active).toBe(false);
    expect(s.container.hasEntityTag(DOWN_TAG)).toBe(false);
  });

  it.each(['always', 'successAndInterrupted', 'success', 'interrupted'] as const)(
    '无目标结果按 %s 返回，不按名称猜测 OnlyDead 可选尸体',
    returnWhen => {
      const s = setup();
      expect(s.executor.execute(step({ targetFilter: 'skipAll', returnWhen }), s.context)).toBe(
        returnWhen === 'always',
      );
      s.setAlive(false);
      expect(s.executor.execute(step({ returnWhen }), s.context)).toBe(returnWhen === 'always');
      expect(s.trace).toEqual([]);
    },
  );

  it('缺来源直接 false，Always 也不能覆盖；未绑定上下文或额外异常明确拒绝', () => {
    const s = setup();
    const missing = new KnockDownOperationExecutor({ ...s.executor.dependencies, sourceId: null });
    expect(missing.execute(step(), s.context)).toBe(false);
    expect(() => s.executor.execute(step())).toThrow('skill runtime context');
    expect(() => s.executor.execute(step({ isExtra: true }), s.context)).toThrow('BuffAddContext');
  });

  it('不制造弱点打断；已有标签只消费一次，成功优先于仅打断', () => {
    const s = setup();
    s.container.addEntityTags([INTERRUPTED_TAG, INTERRUPTED_TAG, 'Immune/KnockDown']);
    expect(s.executor.execute(step({ force: true, returnWhen: 'interrupted' }), s.context)).toBe(
      true,
    );
    expect(s.container.hasEntityTag(INTERRUPTED_TAG)).toBe(true);
    s.container.removeEntityTags(['Immune/KnockDown']);
    expect(s.executor.execute(step({ force: true, returnWhen: 'interrupted' }), s.context)).toBe(
      false,
    );
    expect(s.control.active).toBe(true);
    expect(s.container.hasEntityTag(INTERRUPTED_TAG)).toBe(false);
  });

  it('真实序列按返回策略决定是否执行后续步骤，首次破防的 Always 不会吞掉技能', () => {
    for (const returnWhen of ['always', 'success'] as const) {
      const s = setup();
      const sequence = chainEntry('knockdown-return-policy', [
        step({ returnWhen }),
        { kind: 'dealStagger', parameters: { value: 1 } },
      ]);
      const runtime = new CombatActionSequenceRuntime(s.executor, s.context);
      runtime.createSequence(sequence).tryExecute({});
      expect(s.trace.includes('next')).toBe(returnWhen === 'always');
    }
  });

  it('两场模拟互不共享控制状态；时钟只消费宿主传入的 delta', () => {
    const a = setup();
    const b = setup();
    a.executor.execute(step({ force: true }), a.context);
    expect(b.control.active).toBe(false);
    expect(b.container.hasEntityTag(DOWN_TAG)).toBe(false);
    expect(() => a.control.advance(-1)).toThrow('delta');
    expect(() => a.control.advance(Number.NaN)).toThrow('delta');
  });

  it('根契约可校验与编译，但未装配的标准场景仍失败关闭', () => {
    const skill = {
      key: 'battle',
      timelineBlockFrames: 1,
      costs: [],
      scheduledSequences: [{ startFrame: 0, sequence: { $sequence: 'step-0' } }],
      actionGraph: { main: { nodes: { 'step-0': { action: step(), next: null } } }, macros: {} },
    };
    expect(validateSkillDefinition(skill)).toEqual([]);
    const compiled = chainEntry('fixture', [step()]);
    const issues = inspectStandardPlayerDamageCompatibility({
      endFrame: 10,
      inputs: [{ frame: 0, operatorId: 'ember', skillId: 'battle' }],
      operators: [
        {
          operatorId: 'ember',
          skills: [
            {
              operatorId: 'ember',
              skillId: 'battle',
              skillGroupKey: 'battleSkill',
              skillType: 'battleSkill',
              skillLevel: 1,
              initialBlackboard: {},
              costs: [],
              timelineBlockFrames: 1,
              timelineActions: [{ startFrame: 0, sequence: compiled }],
            },
          ],
        },
      ],
    });
    expect(issues).toHaveLength(1);
    expect(issues[0]!.detail).toContain('audited standard-scene control-consumer bindings');
    const invalid = {
      ...skill,
      actionGraph: {
        main: {
          nodes: {
            'step-0': {
              action: {
                ...step(),
                parameters: {
                  ...step().parameters,
                  duration: { kind: 'constant', value: '1.5' },
                  returnWhen: 'any',
                  targetFilter: 'corpses',
                },
              },
              next: null,
            },
          },
        },
        macros: {},
      },
    };
    expect(validateSkillDefinition(invalid).map(issue => issue.path)).toEqual(
      expect.arrayContaining([
        expect.stringContaining('duration.value'),
        expect.stringContaining('returnWhen'),
        expect.stringContaining('targetFilter'),
      ]),
    );
  });
});
