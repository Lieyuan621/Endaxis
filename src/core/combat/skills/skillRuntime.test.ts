import { createTestBuffReference } from '../buffs/buffTestFixtures';
import { describe, expect, it, vi } from 'vitest';
import { perlica } from '../../../data/operators/perlica.generated';
import { liino } from '../../../data/operators/liino.generated';
import { arcane } from '../../../data/operators/arcane.generated';
import { getSkill } from '../../../data/operators/testUtils';

const arcaneUltimate = getSkill(arcane, 'chr_0032_lizhiyan_ultimate_skill');
import { listOperatorSkillDefinitionBindings } from '../../game-data/operatorSkillDefinitions';
import type { SkillDefinition } from '../../game-data/operatorDefinition';
import { compileSkill } from '../../compiler/compileSkill';
import { CombatReceiptCollector } from '../receipt/combatReceipt';
import { CombatClock } from '../time/combatClock';
import { CombatResources } from '../resources/combatResources';
import { projectResourceChangePoints } from '../../projection/resourceChangePoints';
import { CombatSimulation } from '../runtime/combatSimulation';
import { SkillRuntime, type CombatOperationExecutor } from './skillRuntime';
import { createNativeEventFixture } from '../events/nativeEventTestFixture';
import { AbilitySystemRuntime } from '../abilities/abilitySystemRuntime';
import { ActionBlackboard } from '../actions/actionBlackboard';
import { SkillCooldown } from './skillCooldown';

function findPerlicaSkill(key: string): SkillDefinition {
  for (const group of perlica.skillGroups) {
    const skills = Array.isArray(group.skills) ? group.skills : [group.skills];
    const skill = skills.find(candidate => candidate.key === key);
    if (skill !== undefined) return skill;
  }
  throw new Error(`missing Perlica skill '${key}'`);
}

function createBattleSkillRuntime(
  initialSp: number,
  costFrame?: number,
  cooldownFrames?: number,
  skillDefinition: SkillDefinition = findPerlicaSkill('chr_0004_pelica_normal_skill'),
  emitSkillEnd?: ConstructorParameters<typeof SkillRuntime>[1]['emitSkillEnd'],
  emitAfterSkillApplyCost?: ConstructorParameters<
    typeof SkillRuntime
  >[1]['emitAfterSkillApplyCost'],
) {
  const clock = new CombatClock();
  const resources = new CombatResources({
    sp: initialSp,
    maxSp: 300,
    returnedSp: 0,
    sharedSpGain: { baseGainEfficiency: 1 },
    spRecovery: { valuePerSecond: 10, pauseDuration: 1, pauseRemaining: 0 },
    ultimateEnergySystemUnlocked: true,
    normalSkillUltimateEnergy: { selfGainPerSp: 0.1, otherGainPerSp: 0.2 },
    squad: [
      {
        operatorId: 'perlica',
        ultimateEnergy: 0,
        maxUltimateEnergy: 100,
        ultimateEnergyGainMultiplier: 1,
        allowedUltimateEnergyRecoveryTags: null,
      },
    ],
  });
  const receipt = new CombatReceiptCollector();
  const { semanticEvents, emitAddedBuff, emitOutputDamage } = createNativeEventFixture();
  const operations: CombatOperationExecutor = {
    execute: vi.fn(() => true),
    evaluate: vi.fn(() => true),
  };
  const compiledProgram = compileSkill({
    operatorId: 'perlica',
    skillGroupKey: 'battleSkill',
    skillType: 'battleSkill',
    skillLevel: 12,
    skill:
      costFrame === undefined && cooldownFrames === undefined
        ? skillDefinition
        : {
            ...skillDefinition,
            ...(costFrame === undefined ? {} : { costFrame }),
            ...(cooldownFrames === undefined ? {} : { cooldownFrames }),
          },
  });
  let nextSkillCastId = 1;
  const runtime = new SkillRuntime(compiledProgram, {
    clock,
    resources,
    receipt,
    operations,
    allocateSkillCastId: () => nextSkillCastId++,
    semanticEvents,
    emitSkillEnd,
    emitAfterSkillApplyCost,
  });
  const simulation = new CombatSimulation(clock);
  simulation.add(runtime);
  return {
    clock,
    resources,
    receipt,
    operations,
    runtime,
    semanticEvents,
    simulation,
    emitAddedBuff,
    emitOutputDamage,
  };
}

describe('SkillRuntime', () => {
  it('同一执行程序支持不同施放身份，回执与恢复使用实例身份', () => {
    const program = {
      operatorId: 'operator',
      skillId: 'shared',
      skillType: 'battleSkill' as const,
      initialBlackboard: {},
      costs: [],
      timelineActions: [],
      naturalDurationFrames: 4,
    };
    const clock = new CombatClock();
    const receipt = new CombatReceiptCollector();
    const operations = { execute: () => true, evaluate: () => true };
    let nextId = 1;
    const dependencies = {
      clock,
      receipt,
      operations,
      resources: null,
      allocateSkillCastId: () => nextId++,
    };
    const first = new SkillRuntime(program, { ...dependencies, castId: 'first' });
    const second = new SkillRuntime(program, { ...dependencies, castId: 'second' });
    const inputTarget = { kind: 'operator' as const, operatorId: 'attacker' };
    first.prepareCastInput({ skipApplyCost: false, inputTarget });
    inputTarget.operatorId = 'changed-after-preparation';
    expect(first.tryStart()).toBe(true);
    expect(second.tryStart()).toBe(true);
    expect(first.skillCastInfo.originCastId).toBe('first');
    expect(second.skillCastInfo.originCastId).toBe('second');
    expect(
      receipt.entries
        .filter(entry => entry.event === 'SkillStarted')
        .map(entry => entry.data?.castId),
    ).toEqual(['first', 'second']);
    expect(program).not.toHaveProperty('castId');
    const saved = structuredClone(first.runtimeState);
    const restored = new SkillRuntime(
      program,
      { ...dependencies, castId: 'first' },
      {
        state: saved,
        damageSnapshotProgram: first.damageSnapshotProgram,
        resolveAttachedBuff: () => undefined,
      },
    );
    expect(restored.castId).toBe('first');
    expect(restored.skillCastInfo).toEqual(first.skillCastInfo);
    expect(restored.operationContext.actionInputTarget).toEqual({
      kind: 'operator',
      operatorId: 'attacker',
    });
    expect(second.operationContext.actionInputTarget).toBeUndefined();
    restored.interrupt('default');
    restored.tryStart();
    expect(restored.operationContext.actionInputTarget).toBeUndefined();
    expect(
      () =>
        new SkillRuntime(
          program,
          { ...dependencies, castId: 'second' },
          {
            state: structuredClone(saved),
            damageSnapshotProgram: first.damageSnapshotProgram,
            resolveAttachedBuff: () => undefined,
          },
        ),
    ).toThrow('cast identity does not match');
  });

  it('恢复施放中的技能不重新扣费或开始，后续回执与连续执行一致，再次施放恢复初值', () => {
    const program = {
      operatorId: 'operator',
      skillId: 'saved-skill',
      skillType: 'battleSkill' as const,
      nativeSkillType: 'normalSkill' as const,
      costFrame: 0,
      naturalDurationFrames: 4,
      initialBlackboard: { count: 1 },
      costs: [],
      timelineActions: [
        {
          startFrame: 0,
          endFrame: 4,
          sequence: {
            steps: [
              {
                kind: 'repeatEachTick' as const,
                parameters: {},
                body: {
                  steps: [
                    {
                      kind: 'setContextFlag' as const,
                      parameters: { flag: 'count', value: true, target: 'caster' as const },
                    },
                  ],
                },
              },
            ],
          },
        },
      ],
    };
    const operations: CombatOperationExecutor = {
      evaluate: () => true,
      execute: (_step, context) => {
        const count = context!.blackboard.getNumber('count');
        if (count === undefined) throw new Error('count is missing');
        context!.blackboard.assignDynamic('count', count + 1);
        return true;
      },
    };
    const clock = new CombatClock();
    const receipt = new CombatReceiptCollector();
    const original = new SkillRuntime(program, {
      clock,
      receipt,
      operations,
      resources: null,
      allocateSkillCastId: () => 1,
    });
    const originalAbility = new AbilitySystemRuntime({ skills: [original] });
    originalAbility.tryStartSkill(program.skillId);
    const originalBuff = {
      isRecycled: false,
      reference: createTestBuffReference(),
      finish: vi.fn(),
    };
    original.attachBuffToCast(1, originalBuff);
    clock.advanceFrame();
    originalAbility.advanceFrame();
    const saved = structuredClone({
      skill: original.runtimeState,
      ability: originalAbility.runtimeState,
      clock: clock.runtimeState,
    });
    const savedHistory = receipt.history.snapshot();
    const savedReceiptCount = savedHistory.length;
    const restoredClock = new CombatClock(saved.clock);
    const restoredReceipt = new CombatReceiptCollector(savedHistory);
    const allocateSkillCastId = vi.fn(() => 2);
    const restoredBuff = { isRecycled: false, reference: originalBuff.reference, finish: vi.fn() };
    const resumed = new SkillRuntime(
      program,
      {
        clock: restoredClock,
        receipt: restoredReceipt,
        operations,
        resources: null,
        allocateSkillCastId,
      },
      {
        state: saved.skill,
        damageSnapshotProgram: original.damageSnapshotProgram,
        resolveAttachedBuff: () => restoredBuff,
      },
    );
    const restoredAbility = new AbilitySystemRuntime({ skills: [resumed] }, saved.ability);
    expect(restoredAbility.currentSkillId).toBe(program.skillId);
    expect(allocateSkillCastId).not.toHaveBeenCalled();
    expect(restoredReceipt.entries).toHaveLength(savedReceiptCount);
    for (let frame = 2; frame <= 4; frame++) {
      clock.advanceFrame();
      originalAbility.advanceFrame();
      restoredClock.advanceFrame();
      restoredAbility.advanceFrame();
      expect(resumed.runtimeState).toEqual(original.runtimeState);
      expect(restoredAbility.runtimeState).toEqual(originalAbility.runtimeState);
      expect(restoredReceipt.entries).toEqual(receipt.entries);
    }
    expect(resumed.state).toBe('ended');
    expect(originalBuff.finish).toHaveBeenCalledExactlyOnceWith('other', null);
    expect(restoredBuff.finish).toHaveBeenCalledExactlyOnceWith('other', null);
    expect(resumed.runtimeState.blackboard.values.get('count')).toBeGreaterThan(2);
    restoredAbility.tryStartSkill(program.skillId);
    expect(resumed.runtimeState.blackboard.values.get('count')).toBe(2);
    expect(resumed.runtimeState.execution.skillCastId).toBe(2);
    expect(original.state).toBe('ended');
  });

  it('宿主数据连接实际进度，整图复制保留共享冷却和实体黑板', () => {
    const fixture = createBattleSkillRuntime(300);
    const cooldown = new SkillCooldown(30, 0);
    const entityBlackboard = new ActionBlackboard({ shared: 2 });
    const program = compileSkill({
      operatorId: 'perlica',
      skillGroupKey: 'battleSkill',
      skillType: 'battleSkill',
      skillLevel: 12,
      skill: findPerlicaSkill('chr_0004_pelica_normal_skill'),
    });
    let nextId = 1;
    const create = () =>
      new SkillRuntime(program, {
        clock: fixture.clock,
        resources: fixture.resources,
        receipt: fixture.receipt,
        operations: fixture.operations,
        allocateSkillCastId: () => nextId++,
        cooldown,
        entityBlackboard,
      });
    const first = create();
    const second = create();
    expect(first.runtimeState.timeline).toBeNull();
    expect(first.tryStart()).toBe(true);
    expect(first.runtimeState.execution.state).toBe(first.state);
    expect(first.runtimeState.timeline).not.toBeNull();
    expect(first.runtimeState.cooldown).toBe(cooldown.runtimeState);
    const copied = structuredClone([first.runtimeState, second.runtimeState]);
    expect(copied[0]!.cooldown).toBe(copied[1]!.cooldown);
    expect(copied[0]!.blackboard.entity).toBe(copied[1]!.blackboard.entity);
    expect(copied[0]!.blackboard).not.toBe(copied[1]!.blackboard);
    const savedProgress = copied[0]!.execution.passedFrames;
    first.advance(1 / 30, 1 / 30);
    expect(first.runtimeState.execution.passedFrames).toBe(first.passedFrames);
    expect(first.runtimeState.execution.passedFrames).toBeGreaterThan(savedProgress);
    expect(copied[0]!.execution.passedFrames).toBe(savedProgress);
  });

  it('零费用技能无需账户，仍执行费用阶段事件与正常结束，不生成余额', () => {
    const fixture = createBattleSkillRuntime(300);
    const initial = fixture.resources.snapshot();
    const afterCost = vi.fn();
    const ended = vi.fn();
    const dependencies = {
      clock: fixture.clock,
      receipt: fixture.receipt,
      operations: fixture.operations,
      allocateSkillCastId: () => 1,
      resources: null,
      hostIdentity: {
        actionOwnerId: 'ability-entity:17',
        actionSourceId: 'ability-entity:17',
        eventSourceId: 'ability-entity:17',
        actionOwnerAbilityEntity: { kind: 'abilityEntity' as const, instanceId: 17 },
      },
      emitAfterSkillApplyCost: afterCost,
      emitSkillEnd: ended,
    };
    const program = {
      operatorId: 'perlica',
      skillId: 'zero-cost',
      nativeSkillType: 'normalSkill' as const,
      costFrame: 0,
      naturalDurationFrames: 1,
      initialBlackboard: {},
      timelineActions: [],
      costs: [{ resource: 'ultimateEnergy' as const, value: 0 }],
    };
    const runtime = new SkillRuntime(program, dependencies);
    const ability = new AbilitySystemRuntime({ skills: [runtime] });
    expect(
      ability.tryStartEntitySkill('zero-cost', {
        skillCastId: 77,
        originSkillId: 'source',
        originSkillType: 'comboSkill',
        nonReturnedSpCost: 0,
      }),
    ).toBe(true);
    runtime.advance(1 / 30, 1 / 30);
    expect(afterCost).toHaveBeenCalledOnce();
    expect(ended).toHaveBeenCalledOnce();
    expect(fixture.resources.snapshot()).toEqual(initial);
    expect(projectResourceChangePoints(fixture.receipt.entries)).toEqual([]);
    expect(
      () =>
        new SkillRuntime(
          { ...program, costs: [{ resource: 'ultimateEnergy', value: 1 }] },
          dependencies,
        ),
    ).toThrow('nonzero cost but no resource account');
    expect(() =>
      new SkillRuntime(program, {
        ...dependencies,
        resolveCosts: () => [{ resource: 'ultimateEnergy', value: 1 }],
      }).tryStart(),
    ).toThrow('nonzero cost but no resource account');
  });

  it('能力实体宿主不能借发射干员的资源账本通过装配', () => {
    const fixture = createBattleSkillRuntime(300);
    expect(
      () =>
        new SkillRuntime(
          {
            operatorId: 'perlica',
            skillId: 'callback',
            nativeSkillType: 'normalSkill',
            initialBlackboard: {},
            timelineActions: [],
            costs: [],
          },
          {
            clock: fixture.clock,
            resources: fixture.resources,
            receipt: fixture.receipt,
            operations: fixture.operations,
            allocateSkillCastId: () => 1,
            hostIdentity: {
              actionOwnerId: 'ability-entity:1',
              actionSourceId: 'ability-entity:1',
              eventSourceId: 'ability-entity:1',
              actionOwnerAbilityEntity: { kind: 'abilityEntity', instanceId: 1 },
            },
          },
        ),
    ).toThrow('ability entity skill cannot own an operator resource ledger');
  });
  it('公共宿主接受无技能库分组、等级和技能块的执行程序', () => {
    const fixture = createBattleSkillRuntime(300);
    const ended = vi.fn();
    const runtime = new SkillRuntime(
      {
        operatorId: 'perlica',
        skillId: 'non-timeline-callback',
        skillType: 'battleSkill',
        nativeSkillType: 'normalSkill',
        naturalDurationFrames: 1,
        initialBlackboard: {},
        timelineActions: [],
        costs: [],
      },
      {
        clock: fixture.clock,
        resources: fixture.resources,
        receipt: fixture.receipt,
        operations: fixture.operations,
        allocateSkillCastId: () => 1,
        emitSkillEnd: ended,
      },
    );
    const ability = new AbilitySystemRuntime({ skills: [runtime] });
    expect(runtime.timelineBlockFrames).toBeUndefined();
    expect(
      ability.tryStartEntitySkill('non-timeline-callback', {
        skillCastId: 77,
        originSkillId: 'source',
        originSkillType: 'comboSkill',
        nonReturnedSpCost: 0,
      }),
    ).toBe(true);
    runtime.advance(1 / 30, 0);
    expect(ended).toHaveBeenCalledExactlyOnceWith(
      expect.objectContaining({
        skillId: 'non-timeline-callback',
        skillCastId: 77,
        skillType: 'battleSkill',
      }),
    );
    expect(runtime.skillCastInfo.originSkillType).toBe('comboSkill');
  });

  it('运行宿主身份与静态定义归属、继承施法来源彼此独立', () => {
    const fixture = createBattleSkillRuntime(300);
    const ended = vi.fn();
    const paid = vi.fn();
    const entity = { kind: 'abilityEntity' as const, instanceId: 17 };
    const runtime = new SkillRuntime(
      {
        operatorId: 'definition-owner',
        skillId: 'entity-callback',
        nativeSkillType: 'normalSkill',
        costFrame: 0,
        naturalDurationFrames: 1,
        initialBlackboard: {},
        timelineActions: [],
        costs: [],
      },
      {
        clock: fixture.clock,
        resources: null,
        receipt: fixture.receipt,
        operations: fixture.operations,
        allocateSkillCastId: () => 1,
        emitSkillEnd: ended,
        emitAfterSkillApplyCost: paid,
        hostIdentity: {
          actionOwnerId: 'ability-entity:17',
          actionSourceId: 'ability-entity:17',
          actionOwnerAbilityEntity: entity,
          eventSourceId: 'ability-entity:17',
        },
      },
    );

    const ability = new AbilitySystemRuntime({ skills: [runtime] });
    expect(
      ability.tryStartEntitySkill('entity-callback', {
        skillCastId: 77,
        originSkillId: 'source-combo',
        originSkillType: 'comboSkill',
        nonReturnedSpCost: 0,
      }),
    ).toBe(true);
    expect(runtime.operationContext).toMatchObject({
      actionOwnerId: 'ability-entity:17',
      actionSourceId: 'ability-entity:17',
      actionOwnerAbilityEntity: entity,
    });
    expect(runtime.skillCastInfo).toMatchObject({
      skillCastId: 77,
      originSkillId: 'source-combo',
      originSkillType: 'comboSkill',
    });
    expect(fixture.receipt.entries.find(entry => entry.event === 'SkillStarted')).toMatchObject({
      event: 'SkillStarted',
      sourceId: 'ability-entity:17',
    });
    runtime.advance(1 / 30, 1 / 30);
    const payload = {
      sourceId: 'ability-entity:17',
      targetId: 'ability-entity:17',
      skillId: 'entity-callback',
      skillCastId: 77,
      skillType: undefined,
    };
    expect(paid).toHaveBeenCalledExactlyOnceWith(payload);
    expect(ended).toHaveBeenCalledExactlyOnceWith(payload);
    expect(fixture.resources.sp).toBe(300);
    expect(fixture.receipt.entries.find(entry => entry.event === 'SkillCostApplied')).toMatchObject(
      {
        data: { nonReturnedSpCost: 0 },
      },
    );
  });

  it('callback entry reuses a persistent skill timeline and preserves inherited source separately', () => {
    const ended = vi.fn();
    const callback = createBattleSkillRuntime(
      300,
      undefined,
      undefined,
      {
        key: 'callback',
        timelineBlockFrames: 0,
        naturalDurationFrames: 4,
        blackboard: { value: 1 },
        scheduledSequences: [
          {
            startFrame: 0,
            endFrame: 1,
            sequence: {
              steps: [
                {
                  kind: 'setContextFlag',
                  parameters: { flag: 'write', value: true, target: 'caster' },
                },
              ],
            },
          },
          {
            startFrame: 2,
            endFrame: 3,
            sequence: {
              steps: [
                {
                  kind: 'setContextFlag',
                  parameters: { flag: 'read', value: true, target: 'caster' },
                },
              ],
            },
          },
        ],
      },
      ended,
    );
    const seen: number[] = [];
    const contexts: unknown[] = [];
    callback.operations.execute = (_step, context) => {
      contexts.push(context);
      seen.push(context!.blackboard.getNumber('value')!);
      context!.blackboard.assignDynamic('value', 2);
      return true;
    };
    const source = {
      skillCastId: 77,
      originSkillId: 'launch-skill',
      originSkillType: 'comboSkill' as const,
      nonReturnedSpCost: 12,
    };
    const ability = new AbilitySystemRuntime({ skills: [callback.runtime] });
    expect(ability.tryStartEntitySkill('callback', source, undefined, true)).toBe(true);
    const attached = {
      isRecycled: false,
      reference: createTestBuffReference(),
      finish: vi.fn(() => true),
    };
    callback.runtime.attachBuffToCast(77, attached);
    source.nonReturnedSpCost = 99;
    callback.simulation.advanceFrames(2);
    expect(seen).toEqual([1, 2]);
    expect(contexts[0]).toBe(contexts[1]);
    expect(callback.runtime.skillCastInfo).toEqual({ ...source, nonReturnedSpCost: 12 });
    expect(ended).not.toHaveBeenCalled();
    callback.simulation.advanceFrames(2);
    expect(attached.finish).toHaveBeenCalledExactlyOnceWith('other', null);
    expect(ended).toHaveBeenCalledExactlyOnceWith(
      expect.objectContaining({
        skillId: 'callback',
        skillCastId: 77,
      }),
    );
    expect(
      ability.tryStartEntitySkill('callback', { ...source, skillCastId: 88 }, undefined, true),
    ).toBe(true);
    expect(seen).toEqual([1, 2, 1]);
    expect(callback.runtime.skillCastInfo?.skillCastId).toBe(88);
    // Replacing the same callback is a fresh cast on the same Skill object, not
    // the source skill's CastNextSkill transition or reuse of its direct values.
    expect(
      ability.tryStartEntitySkill('callback', { ...source, skillCastId: 89 }, undefined, true),
    ).toBe(true);
    expect(seen).toEqual([1, 2, 1, 1]);
    expect(callback.runtime.skillCastInfo?.skillCastId).toBe(89);
    expect(ended).toHaveBeenLastCalledWith(expect.objectContaining({ skillCastId: 88 }));
  });
  it.each([false, true])(
    'Buff旁路processing身份独立且覆盖到结束事件：asSkillCast=%s',
    asSkillCast => {
      const current = createBattleSkillRuntime(300);
      current.runtime.prepareSkillCastId(42);
      let ability: AbilitySystemRuntime;
      const observed: [string, number | undefined][] = [];
      const route = createBattleSkillRuntime(
        300,
        undefined,
        undefined,
        {
          key: 'processing-route',
          timelineBlockFrames: 1,
          switchToBuffCast: {
            asSkillCast,
            currentSkillTypes: ['battleSkill'],
            sequence: {
              steps: [
                {
                  kind: 'setContextFlag',
                  parameters: { flag: 'probe', value: true, target: 'caster' },
                },
              ],
            },
          },
          scheduledSequences: [],
        },
        () => observed.push(['end', ability.currentProcessingSkillCastId]),
      );
      route.runtime.prepareSkillCastId(73);
      vi.mocked(route.operations.execute).mockImplementation(() => {
        observed.push(['body', ability.currentProcessingSkillCastId]);
        return true;
      });
      ability = new AbilitySystemRuntime({
        skills: [current.runtime, route.runtime],
        emitBeforeSkillCast: () => {
          observed.push(['before', ability.currentProcessingSkillCastId]);
          expect(ability.currentSkillId).toBe(current.runtime.skillId);
        },
      });
      expect(ability.currentProcessingSkillCastId).toBeUndefined();
      ability.tryStartSkill(current.runtime.skillId);
      expect(ability.currentProcessingSkillCastId).toBe(42);
      ability.prepareBeforeSkillCastStart(route.runtime.skillId, undefined, {
        sourceId: 'owner',
        targetId: 'owner',
        skillId: 'route',
        skillCastId: 73,
      });
      expect(ability.tryStartSkill(route.runtime.skillId)).toBe(true);
      expect(observed).toEqual(
        asSkillCast
          ? [
              ['before', 73],
              ['body', 73],
              ['end', 73],
            ]
          : [['body', 42]],
      );
      expect(ability.currentProcessingSkillCastId).toBe(42);
      expect(current.runtime.skillCastInfo.skillCastId).toBe(42);
      current.runtime.interrupt('castNextSkill');
      expect(ability.currentProcessingSkillCastId).toBeUndefined();
    },
  );

  it.each(['regular', 'buff-route'] as const)(
    'processing临时覆盖在异常后清除，不伪回滚已执行的切换：%s',
    kind => {
      const current = createBattleSkillRuntime(300);
      current.runtime.prepareSkillCastId(42);
      const next = createBattleSkillRuntime(300, undefined, undefined, {
        key: 'next',
        timelineBlockFrames: 1,
        scheduledSequences: [],
        ...(kind === 'buff-route'
          ? { switchToBuffCast: { asSkillCast: true, sequence: { steps: [] } } }
          : {}),
      });
      next.runtime.prepareSkillCastId(73);
      const ability = new AbilitySystemRuntime({
        skills: [current.runtime, next.runtime],
        emitBeforeSkillCast: () => {
          expect(ability.currentProcessingSkillCastId).toBe(73);
          throw new Error('fixture-before-cast');
        },
      });
      ability.tryStartSkill(current.runtime.skillId);
      ability.prepareBeforeSkillCastStart('next', undefined, {
        sourceId: 'owner',
        targetId: 'owner',
        skillId: 'next',
        skillCastId: 73,
      });
      expect(() => ability.tryStartSkill('next')).toThrow('fixture-before-cast');
      // 普通入口按原生顺序先结束旧技能、登记新技能，再执行 BeforeCastStart。
      // finally 只解除临时 processing 覆盖；完整回退必须由外层切面恢复，不能复活旧技能。
      expect(ability.currentProcessingSkillCastId).toBe(kind === 'regular' ? undefined : 42);
      expect(ability.currentSkillId).toBe(
        kind === 'regular' ? next.runtime.skillId : current.runtime.skillId,
      );
      expect(current.runtime.state).toBe(kind === 'regular' ? 'ended' : 'casting');
    },
  );

  it.each([1, 30])('展示宽度 %s 不裁切后续原生序列', timelineBlockFrames => {
    const fixture = createBattleSkillRuntime(300, undefined, undefined, {
      key: 'display-is-not-lifetime',
      timelineBlockFrames,
      naturalDurationFrames: 20,
      scheduledSequences: [
        {
          startFrame: 10,
          sequence: {
            steps: [
              {
                kind: 'setContextFlag',
                parameters: { flag: 'late-effect', value: true, target: 'caster' },
              },
            ],
          },
        },
      ],
    });
    fixture.runtime.tryStart();
    fixture.simulation.advanceFrames(10);
    expect(fixture.operations.execute).toHaveBeenCalledOnce();
    expect(fixture.runtime.state).toBe('casting');
    fixture.simulation.advanceFrames(10);
    expect(fixture.runtime.state).toBe('ended');
  });

  it('真实中断停止尚未到点的序列，而不是根据块体宽度停止', () => {
    const fixture = createBattleSkillRuntime(300, undefined, undefined, {
      key: 'interrupted-sequence',
      timelineBlockFrames: 1,
      naturalDurationFrames: 20,
      scheduledSequences: [
        {
          startFrame: 10,
          sequence: {
            steps: [
              {
                kind: 'setContextFlag',
                parameters: { flag: 'late-effect', value: true, target: 'caster' },
              },
            ],
          },
        },
      ],
    });
    fixture.runtime.tryStart();
    fixture.simulation.advanceFrames(5);
    fixture.runtime.interrupt('castNextSkill');
    fixture.simulation.advanceFrames(20);
    expect(fixture.operations.execute).not.toHaveBeenCalled();
    expect(
      fixture.receipt.entries.filter(entry => entry.event === 'SkillInterrupted'),
    ).toHaveLength(1);
  });

  it.each([0, 3])('准备期释放免技力费用，包括跨越 0 帧的延迟扣费：%s', costFrame => {
    const fixture = createBattleSkillRuntime(0, costFrame);
    fixture.clock.initializeFrame(-1);
    expect(fixture.runtime.tryStart()).toBe(true);
    fixture.simulation.advanceFrames(4);
    expect(fixture.resources.sp).toBe(0);
    expect(fixture.resources.spRecoveryPauseRemaining).toBe(0);
    expect(fixture.runtime.skillCastInfo.nonReturnedSpCost).toBe(0);
    expect(fixture.receipt.entries.filter(entry => entry.event === 'SpChanged')).toEqual([]);
    // 准备期免除的是技能费用，不屏蔽效果主动回技力。
    expect(fixture.resources.gainSp(20).actualValue).toBe(20);
  });

  it.each([false, true])('施法前事件只在需要的 Buff 旁路发布，asSkillCast=%s', asSkillCast => {
    const current = createBattleSkillRuntime(300);
    const ending = createBattleSkillRuntime(300, undefined, undefined, {
      key: 'route',
      timelineBlockFrames: 1,
      switchToBuffCast: {
        asSkillCast,
        currentSkillTypes: ['battleSkill'],
        sequence: { steps: [] },
      },
      scheduledSequences: [],
    });
    const beforeCastStart = vi.fn();
    const fallback = vi.fn();
    const ability = new AbilitySystemRuntime({
      skills: [current.runtime, ending.runtime],
      emitBeforeSkillCast: payload => {
        if (payload.skillCastId === 1) beforeCastStart();
        else fallback();
      },
    });
    ability.tryStartSkill(current.runtime.skillId);
    ability.prepareBeforeSkillCastStart('route', undefined, {
      sourceId: 'owner',
      targetId: 'owner',
      skillId: 'route',
      skillCastId: 1,
    });
    expect(ability.tryStartSkill('route')).toBe(true);
    expect(beforeCastStart).toHaveBeenCalledTimes(asSkillCast ? 1 : 0);
    // A later regular cast (no active matching current skill) must not replay
    // the callback which was consumed/discarded with this bypass attempt.
    current.runtime.interrupt('castNextSkill');
    ability.prepareBeforeSkillCastStart('route', undefined, {
      sourceId: 'owner',
      targetId: 'owner',
      skillId: 'route',
      skillCastId: 2,
    });
    expect(ability.tryStartSkill('route')).toBe(true);
    expect(fallback).toHaveBeenCalledTimes(1);
    expect(beforeCastStart).toHaveBeenCalledTimes(asSkillCast ? 1 : 0);
  });

  it('梨诺生成的终止动作走原生 Buff 旁路，不产生新的技能释放或费用事件', () => {
    const definition = listOperatorSkillDefinitionBindings(liino).find(
      ({ skill }) => skill.key === 'chr_0035_liino_normal_skill_end',
    )?.skill;
    expect(definition).toBeDefined();
    expect(definition!.nativeSkillType).toBe('extraActiveSkill');
    expect(definition!.switchToBuffCast).toMatchObject({
      asSkillCast: false,
      currentSkillTypes: ['battleSkill', 'ultimate'],
    });
    const current = createBattleSkillRuntime(300);
    const emitSkillEnd = vi.fn();
    const emitAfterSkillApplyCost = vi.fn();
    const ending = createBattleSkillRuntime(
      300,
      undefined,
      undefined,
      definition!,
      emitSkillEnd,
      emitAfterSkillApplyCost,
    );
    const afterCastStart = {
      trigger: { kind: 'enemy' as const },
      assignPairs: { preparationProbe: 7 },
    };
    const emit = vi.spyOn(ending.semanticEvents, 'emit');
    const ability = new AbilitySystemRuntime({ skills: [current.runtime, ending.runtime] });
    expect(ability.tryStartSkill(current.runtime.skillId)).toBe(true);
    const currentCast = current.runtime.skillCastInfo;
    ending.runtime.prepareAfterCastStart(afterCastStart);
    expect(ability.tryStartSkill(ending.runtime.skillId)).toBe(true);
    expect(ability.currentSkillId).toBe(current.runtime.skillId);
    expect(ending.runtime.state).toBe('ready');
    expect(ending.resources.sp).toBe(300);
    expect(ending.operations.execute).toHaveBeenCalledWith(
      expect.objectContaining({
        kind: 'applyBuff',
        parameters: expect.objectContaining({
          buffId: 'buff_chr_0035_liino_skill_end',
          inheritSourceSkillCastInfo: true,
        }),
      }),
      expect.objectContaining({ skillCastInfo: currentCast }),
    );
    expect(ending.receipt.entries.map(entry => entry.event)).toEqual([
      'CombatStepReached',
      'SkillSwitchedToBuff',
    ]);
    expect(
      vi
        .mocked(ending.operations.execute)
        .mock.calls[0]?.[1]?.blackboard.getNumber('preparationProbe'),
    ).toBeUndefined();
    expect(emitSkillEnd).not.toHaveBeenCalled();
    expect(emitAfterSkillApplyCost).not.toHaveBeenCalled();
    expect(emit).not.toHaveBeenCalled();
  });
  it('SwitchToAddBuff 旁路保留当前技能并且不启动结束技能时间轴', () => {
    const current = createBattleSkillRuntime(300);
    const ending = createBattleSkillRuntime(300, undefined, undefined, {
      key: 'battleSkillEnd',
      timelineBlockFrames: 1,
      switchToBuffCast: {
        currentSkillTypes: ['battleSkill'],
        sequence: {
          steps: [
            {
              kind: 'applyBuff',
              parameters: { buffId: 'end-signal', target: 'caster' },
            },
          ],
        },
      },
      scheduledSequences: [],
    });
    const ability = new AbilitySystemRuntime({ skills: [current.runtime, ending.runtime] });

    expect(ability.tryStartSkill(current.runtime.skillId)).toBe(true);
    expect(ability.tryStartSkill('battleSkillEnd')).toBe(true);

    expect(current.runtime.state).toBe('casting');
    expect(ending.runtime.state).toBe('ready');
    expect(ability.currentSkillId).toBe(current.runtime.skillId);
    expect(ending.operations.execute).toHaveBeenCalledWith(
      expect.objectContaining({
        kind: 'applyBuff',
        parameters: expect.objectContaining({ buffId: 'end-signal' }),
      }),
      expect.objectContaining({
        skillCastInfo: expect.objectContaining({
          originSkillId: current.runtime.skillId,
          originSkillType: 'battleSkill',
        }),
      }),
    );
  });

  it('SwitchToAddBuff can require the current skill to remain inside its native exclusive window', () => {
    const current = createBattleSkillRuntime(300, undefined, undefined, {
      key: 'current',
      timelineBlockFrames: 101,
      exclusiveFrame: 10,
      scheduledSequences: [{ startFrame: 100, sequence: { steps: [] } }],
    });
    const ending = createBattleSkillRuntime(300, undefined, undefined, {
      key: 'ending',
      timelineBlockFrames: 1,
      switchToBuffCast: {
        currentSkillTypes: ['battleSkill'],
        requiresCurrentSkillNotInterruptible: true,
        sequence: { steps: [] },
      },
      scheduledSequences: [],
    });
    expect(current.runtime.tryStart()).toBe(true);
    const input = () => ({
      skillType: current.runtime.skillType,
      skillCastInfo: current.runtime.skillCastInfo!,
      canInterrupt: current.runtime.canInterrupt,
    });

    expect(ending.runtime.trySwitchToBuffCast(input())).toBe(true);
    expect(() => ending.runtime.trySwitchToBuffCast({ ...input(), skillType: undefined })).toThrow(
      'SwitchToBuffCast player-type condition requires the current skill player type',
    );
    current.simulation.advanceFrames(11);
    expect(ending.runtime.trySwitchToBuffCast(input())).toBe(false);
  });

  it('未比较玩家分类的旁路保留原生技能的不可打断判断', () => {
    const current = createBattleSkillRuntime(300);
    const ending = createBattleSkillRuntime(300, undefined, undefined, {
      key: 'ending',
      timelineBlockFrames: 1,
      switchToBuffCast: {
        requiresCurrentSkillNotInterruptible: true,
        sequence: { steps: [] },
      },
      scheduledSequences: [],
    });
    expect(current.runtime.tryStart()).toBe(true);
    const input = {
      skillType: undefined,
      skillCastInfo: current.runtime.skillCastInfo!,
      canInterrupt: false,
    };
    expect(ending.runtime.trySwitchToBuffCast(input)).toBe(true);
    expect(ending.runtime.trySwitchToBuffCast({ ...input, canInterrupt: true })).toBe(false);
  });

  it('afterCastStart 在初值恢复和 SkillStarted 后、费用及第零帧动作前，只消费一次', () => {
    const fixture = createBattleSkillRuntime(300, 0, undefined, {
      key: 'probe',
      blackboard: { local: 0 },
      timelineBlockFrames: 1,
      scheduledSequences: [
        {
          startFrame: 0,
          sequence: {
            steps: [
              {
                kind: 'dealDamage',
                parameters: {
                  damageType: 'nature',
                  attackScale: { kind: 'blackboard', key: 'local' },
                  tags: ['normalSkill'],
                },
              },
            ],
          },
        },
      ],
    });
    const observed: number[] = [];
    vi.mocked(fixture.operations.execute).mockImplementation((_step, context) => {
      observed.push(context!.blackboard.getNumber('local')!);
      return true;
    });
    const callback = { trigger: { kind: 'enemy' as const }, assignPairs: { local: 4 } };
    fixture.runtime.prepareAfterCastStart(callback);
    fixture.runtime.tryStart();
    expect(observed).toEqual([4]);
    expect(() => fixture.runtime.prepareAfterCastStart(callback)).toThrow('already casting');
    fixture.simulation.advanceFrames(1);
    fixture.runtime.tryStart();
    expect(observed).toEqual([4, 0]);
  });

  it('keeps attachments on the addressed runtime while another skill is casting', () => {
    const previous = createBattleSkillRuntime(300).runtime;
    const next = createBattleSkillRuntime(300).runtime;
    const oldBuff = {
      isRecycled: false,
      reference: createTestBuffReference(),
      finish: vi.fn(() => true),
    };
    const newBuff = {
      isRecycled: false,
      reference: createTestBuffReference(),
      finish: vi.fn(() => true),
    };
    previous.prepareSkillCastId(10);
    previous.tryStart();
    previous.attachBuffToCast(10, oldBuff);
    next.prepareSkillCastId(11);
    next.attachBuffToCast(11, newBuff);
    previous.interrupt('castNextSkill');
    expect(oldBuff.finish).toHaveBeenCalledExactlyOnceWith('other', null);
    expect(newBuff.finish).not.toHaveBeenCalled();
    next.tryStart();
    next.end();
    expect(newBuff.finish).toHaveBeenCalledExactlyOnceWith('other', null);
  });
  it.each(['natural', 'interrupt', 'default'] as const)(
    'ends attached Buffs once, in order, before the %s skill-end event',
    mode => {
      const order: string[] = [];
      const fixture = createBattleSkillRuntime(
        300,
        undefined,
        undefined,
        { key: 'attached', timelineBlockFrames: 0, scheduledSequences: [] },
        () => order.push('skillEnd'),
      );
      const first = {
        isRecycled: false,
        reference: createTestBuffReference(),
        finish: vi.fn(() => {
          order.push('first');
          return true;
        }),
      };
      const alreadyFinished = {
        isRecycled: false,
        reference: createTestBuffReference(),
        finish: vi.fn(() => {
          order.push('second');
          return false;
        }),
      };
      fixture.runtime.prepareSkillCastId(10);
      fixture.runtime.attachBuffToCast(10, first);
      fixture.runtime.attachBuffToCast(10, first);
      fixture.runtime.tryStart();
      fixture.runtime.attachBuffToCast(10, alreadyFinished);
      if (mode === 'natural') fixture.runtime.advanceFrame();
      else fixture.runtime.interrupt(mode === 'default' ? 'default' : 'castNextSkill');
      expect(order).toEqual(['first', 'second', 'skillEnd']);
      expect(first.finish).toHaveBeenCalledExactlyOnceWith('other', null);
      expect(alreadyFinished.finish).toHaveBeenCalledExactlyOnceWith('other', null);
      fixture.runtime.end();
      fixture.runtime.prepareSkillCastId(11);
      expect(() => fixture.runtime.attachBuffToCast(10, first)).toThrow('stale skill cast context');
      fixture.runtime.tryStart();
      fixture.runtime.end();
      expect(first.finish).toHaveBeenCalledOnce();
      expect(order).toEqual(['first', 'second', 'skillEnd', 'skillEnd']);
    },
  );

  it.each(['natural', 'interrupt'] as const)(
    'snapshots attached Buffs before %s timeline cleanup',
    mode => {
      const fixture = createBattleSkillRuntime(300, undefined, undefined, {
        key: 'attachment-snapshot',
        timelineBlockFrames: 10,
        naturalDurationFrames: 1,
        scheduledSequences: [
          {
            startFrame: 0,
            endFrame: 10,
            sequence: {
              steps: [
                {
                  kind: 'setContextFlag',
                  parameters: { flag: 'active', value: true, target: 'caster' },
                },
              ],
            },
          },
        ],
      });
      const addedDuringEnd = {
        isRecycled: false,
        reference: createTestBuffReference(),
        finish: vi.fn(() => true),
      };
      const addedDuringBuffFinish = {
        isRecycled: false,
        reference: createTestBuffReference(),
        finish: vi.fn(() => true),
      };
      const original = {
        isRecycled: false,
        reference: createTestBuffReference(),
        finish: vi.fn(() => {
          fixture.runtime.attachInheritedBuff(addedDuringBuffFinish);
          return true;
        }),
      };
      fixture.operations.end = vi.fn(() => fixture.runtime.attachInheritedBuff(addedDuringEnd));
      fixture.runtime.tryStart();
      fixture.runtime.attachInheritedBuff(original);
      if (mode === 'natural') fixture.runtime.advanceFrame();
      else fixture.runtime.interrupt('castNextSkill');
      expect(original.finish).toHaveBeenCalledExactlyOnceWith('other', null);
      expect(addedDuringEnd.finish).not.toHaveBeenCalled();
      expect(addedDuringBuffFinish.finish).not.toHaveBeenCalled();
      // 新增实例仍在宿主列表中，不被 clear() 丢失；下一次结束快照会包含它们。
      fixture.runtime.tryStart();
      fixture.runtime.end();
      expect(addedDuringEnd.finish).toHaveBeenCalledOnce();
      expect(addedDuringBuffFinish.finish).toHaveBeenCalledOnce();
      expect(original.finish).toHaveBeenCalledOnce();
    },
  );

  it('清理每个附属引用时重新检查有效性，前一个回调可回收后一个实例', () => {
    const fixture = createBattleSkillRuntime(300);
    const later = {
      isRecycled: false,
      reference: createTestBuffReference(),
      finish: vi.fn(() => true),
    };
    const first = {
      isRecycled: false,
      reference: createTestBuffReference(),
      finish: vi.fn(() => {
        later.isRecycled = true;
        return true;
      }),
    };
    fixture.runtime.tryStart();
    fixture.runtime.attachInheritedBuff(first);
    fixture.runtime.attachInheritedBuff(later);
    fixture.runtime.end();
    expect(first.finish).toHaveBeenCalledOnce();
    expect(later.finish).not.toHaveBeenCalled();
    expect(fixture.runtime.runtimeState.execution.attachedBuffs.size).toBe(0);
  });

  it.each(['markCurrentSkillCanDash', 'markCurrentSkillCanInterrupt'] as const)(
    '%s 标记归属当前施放、进入切面并在重放时重置',
    kind => {
      const fixture = createBattleSkillRuntime(300, undefined, undefined, {
        key: 'mark-can-dash',
        timelineBlockFrames: 10,
        naturalDurationFrames: 20,
        exclusiveFrame: 100,
        scheduledSequences: [
          {
            startFrame: 1,
            sequence: {
              steps: [{ kind, parameters: {} }],
            },
          },
        ],
      });

      fixture.runtime.tryStart();
      expect(fixture.runtime.canInterrupt).toBe(false);
      expect(fixture.runtime.canDash).toBe(false);

      fixture.simulation.advanceFrames(1);

      expect(fixture.runtime.canInterrupt).toBe(kind === 'markCurrentSkillCanInterrupt');
      expect(fixture.runtime.canDash).toBe(true);
      expect(
        structuredClone(fixture.runtime.runtimeState)[
          kind === 'markCurrentSkillCanDash' ? 'markedCanDash' : 'markedCanInterrupt'
        ],
      ).toBe(true);

      fixture.runtime.interrupt('dash');
      fixture.runtime.tryStart();
      expect(fixture.runtime.canDash).toBe(false);
      expect(fixture.runtime.canInterrupt).toBe(false);
    },
  );

  it('chr_0032_lizhiyan 终结技按原生第 48 帧开放闪避', () => {
    const markWindow = arcaneUltimate.scheduledSequences.find(item =>
      item.sequence.steps.some(step => step.kind === 'markCurrentSkillCanDash'),
    );
    expect(markWindow?.startFrame).toBe(48);
    const fixture = createBattleSkillRuntime(300, undefined, undefined, {
      ...arcaneUltimate,
      scheduledSequences: markWindow === undefined ? [] : [markWindow],
    });
    fixture.runtime.prepareForcedTimelineCast();
    fixture.runtime.tryStart();

    fixture.simulation.advanceFrames(47);
    expect(fixture.runtime.canDash).toBe(false);

    fixture.simulation.advanceFrames(1);
    expect(fixture.runtime.canDash).toBe(true);
    expect(fixture.runtime.canInterrupt).toBe(false);
  });

  it('keeps equal local Buff numbers on different owners distinct', () => {
    const fixture = createBattleSkillRuntime(300, undefined, undefined, {
      key: 'attachment-owner-identity',
      timelineBlockFrames: 0,
      scheduledSequences: [],
    });
    const first = {
      isRecycled: false,
      reference: { ownerId: 'first', instanceId: 1 },
      finish: vi.fn(() => true),
    };
    const second = {
      isRecycled: false,
      reference: { ownerId: 'second', instanceId: 1 },
      finish: vi.fn(() => true),
    };
    fixture.runtime.tryStart();
    fixture.runtime.attachInheritedBuff(first);
    fixture.runtime.attachInheritedBuff(second);
    fixture.runtime.attachInheritedBuff(first);
    fixture.runtime.end();
    expect(first.finish).toHaveBeenCalledOnce();
    expect(second.finish).toHaveBeenCalledOnce();
  });

  it('does not infer a CastSkillContext for the paid-cost event from its source identity', () => {
    const onCost = vi.fn((event: import('../events/combatAbilityEvent').AbilitySkillPayload) => {
      expect(event.attachBuffToCurrentSkill).toBeUndefined();
    });
    const { runtime } = createBattleSkillRuntime(300, 0, undefined, undefined, undefined, onCost);
    runtime.tryStart();
    expect(onCost).toHaveBeenCalledOnce();
    runtime.end();
  });
  it('publishes skillEnd after both natural completion and interruption', () => {
    const natural = vi.fn();
    const naturalFixture = createBattleSkillRuntime(
      300,
      undefined,
      undefined,
      { key: 'natural-end', timelineBlockFrames: 0, scheduledSequences: [] },
      natural,
    );
    naturalFixture.runtime.tryStart();
    naturalFixture.runtime.advanceFrame();
    expect(natural).toHaveBeenCalledOnce();
    expect(natural).toHaveBeenCalledWith(expect.objectContaining({ skillId: 'natural-end' }));

    const interrupted = vi.fn();
    const interruptedFixture = createBattleSkillRuntime(
      300,
      undefined,
      undefined,
      {
        key: 'interrupted-end',
        timelineBlockFrames: 10,
        scheduledSequences: [{ startFrame: 0, endFrame: 10, sequence: { steps: [] } }],
      },
      interrupted,
    );
    interruptedFixture.runtime.tryStart();
    interruptedFixture.runtime.interrupt('castNextSkill');
    expect(interrupted).toHaveBeenCalledOnce();
    expect(interrupted).toHaveBeenCalledWith(
      expect.objectContaining({ skillId: 'interrupted-end' }),
    );
  });

  it('uses native natural duration instead of the last retained combat action', () => {
    const fixture = createBattleSkillRuntime(300, undefined, undefined, {
      key: 'native-duration',
      timelineBlockFrames: 2,
      naturalDurationFrames: 5,
      scheduledSequences: [{ startFrame: 0, sequence: { steps: [] } }],
    });

    fixture.runtime.tryStart();
    fixture.simulation.advanceFrames(4);
    expect(fixture.runtime.state).toBe('casting');
    fixture.simulation.advanceFrames(1);
    expect(fixture.runtime.state).toBe('ended');
    expect(fixture.runtime.passedFrames).toBe(5);
  });

  it('keeps the current combo segment alive until the next independent input window', () => {
    const first = createBattleSkillRuntime(300, undefined, undefined, {
      key: 'native.enhancedAttack1',
      skillType: 'basicAttack',
      timelineBlockFrames: 22,
      naturalDurationFrames: 160,
      exclusiveFrame: 135,
      inputWindows: {
        commandMappings: [
          {
            startFrame: 0,
            endFrame: 60,
            input: 'basicAttack',
            targetSkillId: 'native.enhancedAttack2',
          },
        ],
        allowedNextSkills: [
          {
            startFrame: 22,
            endFrame: 60,
            skillIds: ['native.enhancedAttack2'],
          },
        ],
      },
      scheduledSequences: [{ startFrame: 0, sequence: { steps: [] } }],
    });
    const second = createBattleSkillRuntime(300, undefined, undefined, {
      key: 'native.enhancedAttack2',
      skillType: 'basicAttack',
      timelineBlockFrames: 27,
      naturalDurationFrames: 155,
      exclusiveFrame: 120,
      scheduledSequences: [],
    });
    const ability = new AbilitySystemRuntime({
      skills: [first.runtime, second.runtime],
      playerActionRoutes: {
        basicAttack: {
          kind: 'basicAttack',
          skillKeys: ['native.enhancedAttack1', 'native.enhancedAttack2'],
          defaultSkillKey: 'native.enhancedAttack1',
        },
      },
      playerActionModes: [
        {
          modeId: 'enhancedMode',
          modeLayer: 'enhancedMode',
          defaultEnabled: true,
          normalAttackSkillKeys: ['native.enhancedAttack1', 'native.enhancedAttack2'],
          commandMappings: {
            basicAttack: {
              skillId: 'native.enhancedAttack1',
            },
          },
        },
      ],
    });

    expect(ability.tryStartSkill('native.enhancedAttack1')).toBe(true);
    for (let frame = 0; frame < 22; frame++) {
      first.clock.advanceFrame();
      second.clock.advanceFrame();
      ability.advanceFrame();
    }

    expect(first.runtime.state).toBe('casting');
    expect(ability.resolvePlayerInputSkill('native.enhancedAttack2', 'basicAttack')).toEqual({
      status: 'matched',
      actualSkillKey: 'native.enhancedAttack2',
    });
    expect(ability.evaluatePlayerInputInterruption('native.enhancedAttack2')).toEqual({
      status: 'allowed',
    });
  });

  it('exposes the native rounded local execute frame to timeline actions', () => {
    const fixture = createBattleSkillRuntime(300, undefined, undefined, {
      key: 'local-frame-fixture',
      timelineBlockFrames: 10,
      scheduledSequences: [
        {
          startFrame: 0,
          endFrame: 10,
          sequence: { steps: [{ kind: 'repeatEachTick', parameters: {}, body: { steps: [] } }] },
        },
      ],
    });

    fixture.runtime.tryStart();
    fixture.runtime.advance(1 / 60, 0);
    expect(fixture.runtime.operationContext.getCurrentTimelineFrame?.()).toBe(0);

    fixture.runtime.advance(1 / 30, 0);
    expect(fixture.runtime.passedFrames).toBe(1.5);
    expect(fixture.runtime.operationContext.getCurrentTimelineFrame?.()).toBe(2);
  });

  it('时间轴跳转改写本次释放的局部帧并跳过中间调度项', () => {
    const fixture = createBattleSkillRuntime(300, undefined, undefined, {
      key: 'timeline-jump-fixture',
      timelineBlockFrames: 6,
      scheduledSequences: [
        {
          startFrame: 1,
          endFrame: 2,
          sequence: {
            steps: [{ kind: 'jumpTimeline', parameters: { destinationFrame: 5 } }],
          },
        },
        {
          startFrame: 3,
          sequence: {
            steps: [
              {
                kind: 'setContextFlag',
                parameters: { flag: 'skipped', value: true, target: 'caster' },
              },
            ],
          },
        },
        {
          startFrame: 5,
          sequence: {
            steps: [
              {
                kind: 'setContextFlag',
                parameters: { flag: 'destination', value: true, target: 'caster' },
              },
            ],
          },
        },
      ],
    });

    fixture.runtime.tryStart();
    fixture.simulation.advanceFrames(1);

    expect(fixture.runtime.passedFrames).toBe(5);
    expect(fixture.operations.execute).not.toHaveBeenCalled();
    expect(fixture.receipt.entries).toContainEqual(
      expect.objectContaining({
        event: 'SkillTimelineJumped',
        data: expect.objectContaining({ destinationFrame: 5 }),
      }),
    );

    fixture.simulation.advanceFrames(1);

    expect(fixture.operations.execute).toHaveBeenCalledTimes(1);
    expect(fixture.operations.execute).toHaveBeenCalledWith(
      expect.objectContaining({
        kind: 'setContextFlag',
        parameters: expect.objectContaining({ flag: 'destination' }),
      }),
      expect.anything(),
    );
  });

  it('有效跳转推进自然结束计时，技能到期清理尚未到结束帧的动作', () => {
    const fixture = createBattleSkillRuntime(300, undefined, undefined, {
      key: 'jump-natural-end',
      timelineBlockFrames: 10,
      naturalDurationFrames: 6,
      scheduledSequences: [
        {
          startFrame: 0,
          endFrame: 10,
          sequence: {
            steps: [
              {
                kind: 'setContextFlag',
                parameters: {
                  flag: 'active',
                  value: true,
                  target: 'caster',
                },
              },
            ],
          },
        },
        {
          startFrame: 1,
          endFrame: 2,
          sequence: { steps: [{ kind: 'jumpTimeline', parameters: { destinationFrame: 5 } }] },
        },
      ],
    });
    fixture.operations.end = vi.fn();
    fixture.runtime.tryStart();
    fixture.simulation.advanceFrames(1);
    expect(fixture.runtime.passedFrames).toBe(5);
    expect(fixture.receipt.entries.some(entry => entry.event === 'SkillEnded')).toBe(false);
    fixture.simulation.advanceFrames(1);
    expect(fixture.runtime.passedFrames).toBe(6);
    expect(fixture.receipt.entries.filter(entry => entry.event === 'SkillEnded')).toHaveLength(1);
    expect(fixture.operations.end).toHaveBeenCalledTimes(1);
  });

  it.each([
    { current: 6, destination: 5, expected: 6, jumped: false },
    { current: 5.0001, destination: 5, expected: 5, jumped: true },
  ])(
    '跳转下界由技能宿主管理：$current → $destination',
    ({ current, destination, expected, jumped }) => {
      const fixture = createBattleSkillRuntime(300, undefined, undefined, {
        key: 'jump-lower-bound',
        timelineBlockFrames: 20,
        naturalDurationFrames: 20,
        scheduledSequences: [],
      });
      fixture.runtime.tryStart();
      fixture.runtime.advance(current / 30, 0);
      expect(() =>
        fixture.runtime.operationContext.requestTimelineJump!(destination),
      ).not.toThrow();
      expect(fixture.runtime.passedFrames).toBeCloseTo(expected, 9);
      expect(fixture.receipt.entries.some(entry => entry.event === 'SkillTimelineJumped')).toBe(
        jumped,
      );
    },
  );

  it('越过自然时长同步清理并发布结束，不移动时间轴或执行跳转后的步骤', () => {
    const ended = vi.fn();
    const fixture = createBattleSkillRuntime(
      300,
      undefined,
      undefined,
      {
        key: 'jump-past-end',
        timelineBlockFrames: 20,
        naturalDurationFrames: 5,
        scheduledSequences: [
          {
            startFrame: 0,
            endFrame: 20,
            sequence: {
              steps: [
                {
                  kind: 'setContextFlag',
                  parameters: { flag: 'active', value: true, target: 'caster' },
                },
              ],
            },
          },
          {
            startFrame: 1,
            endFrame: 2,
            sequence: {
              steps: [
                { kind: 'jumpTimeline', parameters: { destinationFrame: 6 } },
                {
                  kind: 'setContextFlag',
                  parameters: { flag: 'unreachable', value: true, target: 'caster' },
                },
              ],
            },
          },
        ],
      },
      ended,
    );
    fixture.operations.end = vi.fn(() => fixture.runtime.operationContext.requestTimelineJump!(3));
    ended.mockImplementation(() => fixture.runtime.operationContext.requestTimelineJump!(4));
    fixture.runtime.tryStart();
    fixture.simulation.advanceFrames(1);
    expect(fixture.runtime.state).toBe('ended');
    expect(fixture.runtime.passedFrames).toBe(1);
    expect(ended).toHaveBeenCalledTimes(1);
    expect(fixture.operations.end).toHaveBeenCalledTimes(1);
    expect(fixture.operations.execute).toHaveBeenCalledTimes(1);
    expect(fixture.receipt.entries.some(entry => entry.event === 'SkillTimelineJumped')).toBe(
      false,
    );
    fixture.simulation.advanceFrames(2);
    expect(ended).toHaveBeenCalledTimes(1);
  });

  it('时间轴自终止丢弃未来调度且不改写局部帧', () => {
    const fixture = createBattleSkillRuntime(300, undefined, undefined, {
      key: 'timeline-finish-fixture',
      timelineBlockFrames: 10,
      scheduledSequences: [
        {
          startFrame: 2,
          sequence: { steps: [{ kind: 'finishTimeline', parameters: {} }] },
        },
        {
          startFrame: 8,
          sequence: {
            steps: [
              {
                kind: 'setContextFlag',
                parameters: { flag: 'future', value: true, target: 'caster' },
              },
            ],
          },
        },
      ],
    });

    fixture.runtime.tryStart();
    fixture.simulation.advanceFrames(2);

    expect(fixture.runtime.state).toBe('ended');
    expect(fixture.runtime.passedFrames).toBe(2);
    expect(fixture.operations.execute).not.toHaveBeenCalled();
    expect(fixture.receipt.entries).toContainEqual(
      expect.objectContaining({ event: 'SkillTimelineFinished' }),
    );
  });

  it('只在调度区间内响应技能临时监听事件，并在中断时立即注销', () => {
    const fixture = createBattleSkillRuntime(300, undefined, undefined, {
      key: 'listener-fixture',
      timelineBlockFrames: 4,
      scheduledSequences: [
        {
          startFrame: 1,
          endFrame: 4,
          sequence: {
            steps: [
              {
                kind: 'listenForCombatEvents',
                parameters: {
                  responses: [
                    {
                      key: 'normal-skill-hit',
                      event: { kind: 'damageTagHit', tag: 'normalSkill', scope: 'operator' },
                      condition: { kind: 'combatActive' },
                      sequence: {
                        steps: [
                          {
                            kind: 'setContextFlag',
                            parameters: { flag: 'first', value: true, target: 'caster' },
                          },
                          {
                            kind: 'setContextFlag',
                            parameters: { flag: 'second', value: true, target: 'caster' },
                          },
                        ],
                      },
                    },
                  ],
                },
              },
            ],
          },
        },
      ],
    });
    const emit = () =>
      fixture.emitOutputDamage({
        sourceId: 'perlica',
        tags: ['normalSkill'],
      });
    const evaluated: unknown[] = [];
    vi.mocked(fixture.operations.evaluate).mockImplementation((condition, context) => {
      // 公共响应退出后恢复同一草稿，须在调用中观察事件，不能检查 mock 保存的可变引用。
      evaluated.push([condition, { ...context }]);
      return true;
    });

    fixture.runtime.tryStart();
    emit();
    expect(fixture.operations.execute).not.toHaveBeenCalled();

    fixture.simulation.advanceFrames(1);
    emit();
    expect(evaluated).toContainEqual([
      { kind: 'combatActive' },
      expect.objectContaining({
        blackboard: fixture.runtime.operationContext.blackboard,
        event: expect.objectContaining({
          event: 'outputDamage',
          payload: expect.objectContaining({ sourceId: 'perlica', tags: ['normalSkill'] }),
        }),
      }),
    ]);
    expect(vi.mocked(fixture.operations.execute).mock.calls.map(call => call[0])).toMatchObject([
      { kind: 'setContextFlag', parameters: { flag: 'first' } },
      { kind: 'setContextFlag', parameters: { flag: 'second' } },
    ]);

    fixture.runtime.interrupt('castNextSkill');
    emit();
    expect(fixture.operations.execute).toHaveBeenCalledTimes(2);
  });

  it('只在事件响应条件通过时同步跳转宿主时间轴，并在区间结束后注销', () => {
    const fixture = createBattleSkillRuntime(300, undefined, undefined, {
      key: 'listener-jump-fixture',
      timelineBlockFrames: 8,
      scheduledSequences: [
        {
          startFrame: 1,
          endFrame: 8,
          sequence: {
            steps: [
              {
                kind: 'listenForCombatEvents',
                parameters: {
                  responses: [
                    {
                      key: 'jump-on-buff',
                      event: { kind: 'buffApplied' },
                      sequence: {
                        steps: [
                          {
                            kind: 'conditional',
                            parameters: {
                              condition: {
                                kind: 'buffIdStackCompare',
                                target: 'caster',
                                buffIds: ['buff.skill.end'],
                                operator: 'greaterOrEqual',
                                value: { kind: 'constant', value: 1 },
                              },
                            },
                            whenTrue: {
                              steps: [
                                { kind: 'jumpTimeline', parameters: { destinationFrame: 6 } },
                              ],
                            },
                          },
                        ],
                      },
                    },
                  ],
                },
              },
            ],
          },
        },
      ],
    });

    fixture.runtime.tryStart();
    fixture.simulation.advanceFrames(1);
    vi.mocked(fixture.operations.evaluate).mockReturnValueOnce(false);
    fixture.emitAddedBuff({
      targetId: 'perlica',
      sourceId: 'enemy',
      buffId: 'buff.unrelated',
      buffTags: [],
    });
    expect(fixture.runtime.passedFrames).toBe(1);

    vi.mocked(fixture.operations.evaluate).mockReturnValueOnce(true);
    fixture.emitAddedBuff({
      targetId: 'perlica',
      sourceId: 'perlica',
      buffId: 'buff.skill.end',
      buffTags: [],
    });

    expect(fixture.runtime.passedFrames).toBe(6);
    expect(fixture.receipt.entries).toContainEqual(
      expect.objectContaining({
        event: 'SkillTimelineJumped',
        data: expect.objectContaining({ destinationFrame: 6 }),
      }),
    );

    fixture.simulation.advanceFrames(2);
    const evaluationCount = vi.mocked(fixture.operations.evaluate).mock.calls.length;
    fixture.emitAddedBuff({
      targetId: 'perlica',
      sourceId: 'perlica',
      buffId: 'buff.skill.end',
      buffTags: [],
    });
    expect(fixture.operations.evaluate).toHaveBeenCalledTimes(evaluationCount);
  });

  it('同一次释放只执行一次共享作用域，并在下一次释放时重置', () => {
    const onceStep = {
      kind: 'once',
      parameters: { scopeKey: 'normal-attack-sp' },
      body: {
        steps: [
          {
            kind: 'setContextFlag',
            parameters: { flag: 'executed', value: true, target: 'caster' },
          },
        ],
      },
    } as const;
    const fixture = createBattleSkillRuntime(300, undefined, undefined, {
      key: 'once-fixture',
      timelineBlockFrames: 2,
      scheduledSequences: [
        {
          startFrame: 0,
          sequence: {
            steps: [
              onceStep,
              {
                kind: 'setContextFlag',
                parameters: { flag: 'continued', value: true, target: 'caster' },
              },
            ],
          },
        },
        { startFrame: 1, sequence: { steps: [onceStep] } },
      ],
    });
    vi.mocked(fixture.operations.execute).mockReturnValueOnce(false);

    fixture.runtime.tryStart();
    fixture.simulation.advanceFrames(1);
    expect(fixture.operations.execute).toHaveBeenCalledTimes(2);

    fixture.runtime.end();
    fixture.runtime.tryStart();
    expect(fixture.operations.execute).toHaveBeenCalledTimes(4);
  });

  it('为每个运行实例隔离动作黑板并在再次释放时重置', () => {
    const first = createBattleSkillRuntime(300);
    const second = createBattleSkillRuntime(300);

    first.runtime.operationContext.blackboard.assignDynamic('count', 2);
    expect(second.runtime.operationContext.blackboard.getNumber('count')).toBeUndefined();

    first.runtime.tryStart();
    expect(first.runtime.skillCastInfo).toEqual({
      skillCastId: 1,
      originSkillId: 'chr_0004_pelica_normal_skill',
      originSkillType: 'battleSkill',
      nonReturnedSpCost: 100,
    });
    first.runtime.operationContext.blackboard.assignDynamic('count', 3);
    first.runtime.end();
    first.runtime.tryStart();

    expect(first.runtime.operationContext.blackboard.getNumber('count')).toBeUndefined();
    expect(first.runtime.skillCastInfo.skillCastId).toBe(2);
  });

  it('applies frame-zero cost during the native initial tick', () => {
    const fixture = createBattleSkillRuntime(300);

    expect(fixture.runtime.tryStart()).toBe(true);
    expect(fixture.runtime.skillCastInfo.nonReturnedSpCost).toBe(100);

    expect(fixture.runtime.appliedCost).toBe(true);
    expect(fixture.resources.sp).toBe(200);
    expect(fixture.receipt.entries.map(entry => entry.event)).toEqual([
      'SkillStarted',
      'SpChanged',
      'SkillCostApplied',
      'TimelineActionStarted',
      'CombatStepReached',
    ]);
  });

  it('原生延迟施法可跳过费用并完整继承来源施法身份', () => {
    const fixture = createBattleSkillRuntime(0);
    const inherited = {
      skillCastId: 41,
      originSkillId: 'ultimateSkill',
      originSkillType: 'ultimate' as const,
      nonReturnedSpCost: 73,
    };

    fixture.runtime.prepareCastInput({
      skipApplyCost: true,
      inheritedSkillCastInfo: inherited,
    });

    expect(fixture.runtime.tryStart()).toBe(true);
    expect(fixture.resources.sp).toBe(0);
    expect(fixture.runtime.appliedCost).toBe(true);
    expect(fixture.runtime.skillCastInfo).toEqual(inherited);
    expect(fixture.receipt.entries.some(entry => entry.event === 'SpChanged')).toBe(false);
    expect(fixture.receipt.entries.some(entry => entry.event === 'SkillCostApplied')).toBe(false);
  });

  it('在费用成功应用后、同帧时间轴动作前同步发布费用事件', () => {
    const emitted = vi.fn();
    const fixture = createBattleSkillRuntime(
      300,
      0,
      undefined,
      {
        key: 'cost-event-order',
        costFrame: 0,
        costs: [{ resource: 'sp', value: 100 }],
        timelineBlockFrames: 1,
        scheduledSequences: [
          {
            startFrame: 0,
            sequence: {
              steps: [
                {
                  kind: 'modifyActionValue',
                  parameters: {
                    key: 'hit',
                    operation: 'assign',
                    value: { kind: 'constant', value: 1 },
                  },
                },
              ],
            },
          },
        ],
      },
      undefined,
      payload => {
        expect(fixture.resources.sp).toBe(200);
        expect(fixture.operations.execute).not.toHaveBeenCalled();
        emitted(payload);
      },
    );

    fixture.runtime.tryStart();

    expect(emitted).toHaveBeenCalledOnce();
    expect(emitted).toHaveBeenCalledWith(
      expect.objectContaining({
        skillId: 'cost-event-order',
        skillCastId: 1,
      }),
    );
    expect(fixture.operations.execute).toHaveBeenCalledOnce();
  });

  it('费用失败时不发布费用事件', () => {
    const emitted = vi.fn();
    const fixture = createBattleSkillRuntime(
      99,
      0,
      undefined,
      findPerlicaSkill('chr_0004_pelica_normal_skill'),
      undefined,
      emitted,
    );

    fixture.runtime.tryStart();

    expect(emitted).not.toHaveBeenCalled();
  });

  it('updates the current skill-cast info only when delayed cost is actually paid', () => {
    const fixture = createBattleSkillRuntime(300, 3);

    fixture.runtime.tryStart();
    expect(fixture.runtime.skillCastInfo.nonReturnedSpCost).toBe(0);
    expect(fixture.resources.sp).toBe(300);

    fixture.simulation.advanceFrames(3);
    expect(fixture.runtime.skillCastInfo.nonReturnedSpCost).toBe(100);
    expect(fixture.resources.sp).toBe(200);
  });

  it('executes Perlica hit steps in source order at relative frame 13', () => {
    const fixture = createBattleSkillRuntime(300);
    fixture.runtime.tryStart();

    fixture.simulation.advanceFrames(13);

    expect(fixture.operations.execute).toHaveBeenCalledTimes(4);
    expect(vi.mocked(fixture.operations.execute).mock.calls.map(([step]) => step.kind)).toEqual([
      'findCharacterTeamTargets',
      'applyElementalInfliction',
      'dealDamage',
      'gainSquadUltimateEnergyFromSkillCost',
    ]);
    expect(
      fixture.receipt.entries
        .filter(entry => entry.event === 'CombatStepReached')
        .map(entry => entry.data?.kind),
    ).toEqual([
      'findCharacterTeamTargets',
      'applyElementalInfliction',
      'dealDamage',
      'gainSquadUltimateEnergyFromSkillCost',
    ]);
    // 原生 SkillData.durationFrame 是自然结束边界；动作在 13 帧完成不等于技能结束。
    expect(fixture.runtime.state).toBe('casting');
    fixture.simulation.advanceFrames(142);
    expect(fixture.receipt.entries.at(-1)).toMatchObject({
      frame: 155,
      time: 155 / 30,
      event: 'SkillEnded',
    });
  });

  it('reports insufficient SP without preventing the scheduled skill simulation', () => {
    const fixture = createBattleSkillRuntime(99);

    expect(fixture.runtime.tryStart()).toBe(true);

    expect(fixture.runtime.state).toBe('casting');
    expect(fixture.resources.sp).toBe(99);
    expect(fixture.receipt.entries.map(entry => entry.event)).toEqual([
      'SkillCostUnavailableAtStart',
      'SkillStarted',
      'SkillCostRejected',
      'TimelineActionStarted',
      'CombatStepReached',
    ]);

    fixture.simulation.advanceFrames(13);
    expect(fixture.operations.execute).toHaveBeenCalledTimes(4);
    expect(
      fixture.receipt.entries.filter(entry => entry.event === 'SkillCostRejected'),
    ).toHaveLength(1);
  });

  it('continues the native timeline when shared resource is unavailable at the cost point', () => {
    const program = compileSkill({
      operatorId: 'perlica',
      skillGroupKey: 'battleSkill',
      skillType: 'battleSkill',
      skillLevel: 12,
      skill: { ...findPerlicaSkill('chr_0004_pelica_normal_skill'), costFrame: 3 },
    });
    const clock = new CombatClock();
    const resources = new CombatResources({
      sp: 100,
      maxSp: 300,
      returnedSp: 0,
      sharedSpGain: { baseGainEfficiency: 1 },
      spRecovery: { valuePerSecond: 10, pauseDuration: 1, pauseRemaining: 0 },
      ultimateEnergySystemUnlocked: true,
      normalSkillUltimateEnergy: { selfGainPerSp: 0.1, otherGainPerSp: 0.2 },
      squad: [],
    });
    const receipt = new CombatReceiptCollector();
    const operations: CombatOperationExecutor = {
      execute: vi.fn(() => true),
      evaluate: vi.fn(() => true),
    };
    const runtime = new SkillRuntime(program, {
      clock,
      resources,
      receipt,
      operations,
      allocateSkillCastId: () => 1,
    });
    const simulation = new CombatSimulation(clock);
    simulation.add(runtime);
    expect(runtime.tryStart()).toBe(true);
    expect(resources.pay('other', [{ resource: 'sp', value: 100 }]).paid).toBe(true);

    simulation.advanceFrames(155);

    expect(runtime.appliedCost).toBe(false);
    // 扣费失败不阻止时间轴动作，技能仍在原生自然寿命结束。
    expect(runtime.state).toBe('ended');
    expect(operations.execute).toHaveBeenCalledTimes(4);
    expect(receipt.entries.some(entry => entry.event === 'SkillCostRejected')).toBe(true);
    expect(receipt.entries.at(-1)?.event).toBe('SkillEnded');
  });

  it('refunds a reserved cooldown when interrupted before the recovered commit frame', () => {
    const fixture = createBattleSkillRuntime(300, 3, 10);

    fixture.runtime.tryStart();
    fixture.simulation.advanceFrames(2);
    fixture.runtime.interrupt('castNextSkill');

    expect(fixture.runtime.cooldown.ready).toBe(true);
    expect(fixture.receipt.entries.map(entry => entry.event)).toContain('SkillCooldownRefunded');
  });

  it('records an unavailable cooldown but still simulates the authored cast', () => {
    const fixture = createBattleSkillRuntime(300, 3, 10);

    fixture.runtime.tryStart();
    fixture.simulation.advanceFrames(3);
    fixture.runtime.interrupt('castNextSkill');
    expect(fixture.runtime.cooldown.remainingFrames).toBe(7);

    expect(fixture.runtime.tryStart()).toBe(true);
    expect(fixture.runtime.state).toBe('casting');
    expect(fixture.runtime.cooldown.remainingFrames).toBe(7);
    expect(fixture.receipt.entries.map(entry => entry.event)).toContain(
      'SkillCooldownUnavailableAtStart',
    );

    fixture.simulation.advanceFrames(7);
    expect(fixture.runtime.cooldown.ready).toBe(true);
    expect(fixture.receipt.entries.map(entry => entry.event)).toContain('SkillCooldownReady');
  });
});
