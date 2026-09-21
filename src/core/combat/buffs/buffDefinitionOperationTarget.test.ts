import { describe, expect, it, vi } from 'vitest';
import { CombatAttributeSet } from '../attributes/combatAttributes';
import { CombatBuffContainer, type CombatBuffDefinition } from './combatBuffs';
import { ActionBlackboard } from '../actions/actionBlackboard';
import type { CombatBuffDefinitionEntry } from './combatBuffDefinitions';
import { BuffDefinitionOperationTarget } from './buffDefinitionOperationTarget';
import { TimeDilationRuntime } from '../time/timeDilationRuntime';

type Attribute = 'cost';

describe('BuffDefinitionOperationTarget', () => {
  it('终结技暂停普通 Buff，只有采用实体时间的 Buff 可随施法者继续推进', () => {
    const dilation = new TimeDilationRuntime({});
    dilation.startGlobal({
      durationSeconds: 2,
      slot: 'test',
      priority: 1,
      constantScale: 0,
      ignoredOperatorIds: ['caster'],
    });
    const container = new CombatBuffContainer('caster', new CombatAttributeSet<string>());
    const target = new BuffDefinitionOperationTarget(container, {
      get: id => ({
        id,
        stackingType: 'unlimited',
        durationSeconds: 10,
        timeClock: id as 'default' | 'global' | 'self',
      }),
    });
    const buffs = ['default', 'global', 'self'].map(buffId =>
      target.applyScoped({ buffId, sourceId: 'caster', blackboardValues: {} })!,
    );
    target.advanceWithDeltas(dilation.getAbilityTickDeltas('caster', 1));
    expect(buffs.map(buff => buff.remainingDuration)).toEqual([10, 9, 10]);
  });
  it('records births before nested Start and publishes the actual instance, without recreating refreshed Buffs', () => {
    const order: string[] = [];
    const born = vi.fn((buff: { instanceId: number }) => order.push(`born:${buff.instanceId}`));
    const container = new CombatBuffContainer<string>(
      'operator',
      new CombatAttributeSet<string>(),
      undefined,
      null,
      undefined,
      undefined,
      undefined,
      undefined,
      undefined,
      undefined,
      undefined,
      undefined,
      born,
    );
    const applied = vi.fn();
    let target: BuffDefinitionOperationTarget<string>;
    const nested: CombatBuffDefinition<string> = {
      id: 'nested',
      stackingType: 'unlimited',
      actions: {
        start: buff => {
          order.push(`start:${buff.instanceId}`);
          if (buff.instanceId === 1)
            target.apply({ buffId: 'nested', sourceId: 'other', blackboardValues: {} });
        },
      },
    };
    target = new BuffDefinitionOperationTarget(
      container,
      {
        get: id =>
          id === 'nested' ? nested : { id, stackingType: 'refresh', durationSeconds: 10 },
      },
      undefined,
      undefined,
      applied,
    );
    const parent = target.applyScoped({
      buffId: 'nested',
      physicalInflictionType: 'airborne',
      sourceId: 'operator',
      blackboardValues: {},
    });
    expect(order).toEqual(['born:1', 'start:1', 'born:2', 'start:2']);
    expect(applied.mock.calls.map(call => call[1].instanceId)).toEqual([2, 1]);
    expect(applied.mock.calls[1]?.[1]).toBe(parent);
    expect(applied.mock.calls[1]?.[0].physicalInflictionType).toBe('airborne');
    expect(applied.mock.calls[0]?.[0].physicalInflictionType).toBeUndefined();
    const request = { buffId: 'refresh', sourceId: 'operator', blackboardValues: {} };
    const first = target.applyScoped(request);
    expect(target.applyScoped(request)).toBe(first);
    expect(born).toHaveBeenCalledTimes(3);
  });
  it('通过当前定义编译端口重建保存实例，不重新施加 Buff', () => {
    const originalContainer = new CombatBuffContainer<string>(
      'operator',
      new CombatAttributeSet<string>(),
    );
    const compile = (entry: CombatBuffDefinitionEntry): CombatBuffDefinition<string> => ({
      id: entry.id,
      stackingType: entry.stackingType,
      durationSeconds: entry.durationSeconds,
    });
    const original = new BuffDefinitionOperationTarget(originalContainer, {
      get: () => undefined,
      compile,
    });
    const definition = { stackingType: 'refresh', durationSeconds: 10 } as const;
    original.apply({
      buffId: 'saved',
      definition,
      sourceId: 'operator',
      blackboardValues: { value: 3 },
      getSourceAttributeValue: () => 42,
      sourceAttributeOwnerId: 'source-entity',
    });
    originalContainer.tick(1);
    const saved = structuredClone(originalContainer.runtimeState);
    const restoredContainer = new CombatBuffContainer(
      'operator',
      new CombatAttributeSet<string>(saved.attributes),
      undefined,
      null,
      ActionBlackboard.bindRuntimeState(saved.entityBlackboard),
      undefined,
      undefined,
      undefined,
      undefined,
      undefined,
      undefined,
      saved,
    );
    const restored = new BuffDefinitionOperationTarget(restoredContainer, {
      get: () => undefined,
      compile,
    });

    const resolveDefinition = (id: string, ownerId: string) =>
      id === 'saved' && ownerId === 'operator' ? definition : undefined;
    expect(() => restored.bindRestoredDefinitionInstances(resolveDefinition)).toThrow(
      "restored Buff 'saved' source attribute binding does not match",
    );
    restored.bindRestoredDefinitionInstances(resolveDefinition, state => ({
      sourceAttributeOwnerId: state.sourceAttributeOwnerId!,
      getSourceAttributeValue: () => 42,
    }));

    expect(restored.runtimeState).toBe(saved);
    expect(saved.instances.get(1)!.sourceAttributeOwnerId).toBe('source-entity');
    expect(restored.findFirstByIds(['saved'])?.remainingDuration).toBe(9);
    expect(restored.findFirstByIds(['saved'])?.blackboard.getNumber('value')).toBe(3);
    expect(restored.resolveHandle({ ownerId: 'operator', instanceId: 1 })).toBeDefined();
  });

  it('保存动作宿主时优先用带生命周期绑定的来源定义恢复', () => {
    const compile = (entry: CombatBuffDefinitionEntry): CombatBuffDefinition<string> => ({
      id: entry.id,
      stackingType: entry.stackingType,
      durationSeconds: entry.durationSeconds,
    });
    const sourceDefinition = {
      stackingType: 'unique',
      durationSeconds: 10,
      lifecycleSequences: { trigger: { steps: [] } },
    } as const;
    const originalContainer = new CombatBuffContainer<string>(
      'enemy',
      new CombatAttributeSet<string>(),
    );
    const original = new BuffDefinitionOperationTarget(originalContainer, {
      get: () => undefined,
      compile,
    });
    original.configureLifecycleOperations(() => ({
      execute: () => true,
      evaluate: () => true,
    }));
    original.apply({
      buffId: 'shared-lifecycle-buff',
      sourceId: 'operator',
      definitionOwnerId: 'operator',
      definition: sourceDefinition,
      blackboardValues: {},
    });
    const saved = structuredClone(originalContainer.runtimeState);
    expect(saved.instances.get(1)?.actionHost).not.toBeNull();

    const restoredContainer = new CombatBuffContainer(
      'enemy',
      new CombatAttributeSet<string>(saved.attributes),
      undefined,
      null,
      ActionBlackboard.bindRuntimeState(saved.entityBlackboard),
      undefined,
      undefined,
      undefined,
      undefined,
      undefined,
      undefined,
      saved,
    );
    const restored = new BuffDefinitionOperationTarget(restoredContainer, {
      // 元素系统可能预先缓存同身份的静态定义；它不能接管带动作宿主的实例。
      get: id => ({ id, stackingType: 'unique' }),
      compile,
    });
    restored.configureLifecycleOperations(() => ({
      execute: () => true,
      evaluate: () => true,
    }));

    expect(() =>
      restored.bindRestoredDefinitionInstances((id, ownerId) =>
        id === 'shared-lifecycle-buff' && ownerId === 'operator' ? sourceDefinition : undefined,
      ),
    ).not.toThrow();
    expect(restored.resolveHandle({ ownerId: 'enemy', instanceId: 1 })).toBeDefined();
  });

  it.each(['unique', 'refresh'] as const)(
    '成功事件早于已有关键词增强，%s 重施按实际结果执行',
    stackingType => {
      const container = new CombatBuffContainer<string>('enemy', new CombatAttributeSet<string>());
      const keyword = container.add(
        {
          id: 'keyword',
          stackingType: 'unlimited',
          blackboard: { rate: 0.1 },
          keywordEnhancements: [
            {
              triggerBuffIds: ['trigger'],
              operation: 'add',
              targetKey: 'rate',
              initialValue: 0.1,
              value: 0.05,
            },
          ],
        },
        'source',
      )!;
      const events: string[] = [];
      const rates: number[] = [];
      const target = new BuffDefinitionOperationTarget(
        container,
        { get: id => ({ id, stackingType }) },
        undefined,
        undefined,
        () => events.push('added'),
        () => events.push('before-output'),
        event => {
          events.push('output');
          expect(event.buff).toBe(container.findFirstByIds(['trigger']));
          rates.push(keyword.blackboard.getNumber('rate')!);
        },
        () => events.push('before-added'),
      );
      const request = { buffId: 'trigger', sourceId: 'source', blackboardValues: {} };
      expect(target.apply(request)).toBe(true);
      expect(events).toEqual(['before-output', 'before-added', 'added', 'output']);
      expect(rates).toEqual([0.1]);
      expect(keyword.blackboard.getNumber('rate')).toBeCloseTo(0.15);
      events.length = 0;
      expect(target.apply(request)).toBe(stackingType === 'refresh');
      expect(events).toEqual(
        stackingType === 'refresh'
          ? ['before-output', 'before-added', 'added', 'output']
          : ['before-output', 'before-added'],
      );
      expect(keyword.blackboard.getNumber('rate')).toBeCloseTo(
        stackingType === 'refresh' ? 0.2 : 0.15,
      );
    },
  );
  it('returns the same scoped handle when refreshing the same Buff instance', () => {
    const container = new CombatBuffContainer('operator', new CombatAttributeSet<string>());
    const target = new BuffDefinitionOperationTarget(container, {
      get: id => ({ id, stackingType: 'refresh' as const, durationSeconds: 30 }),
    });
    const request = { buffId: 'attached', sourceId: 'operator', blackboardValues: {} };
    const first = target.applyScoped(request)!;
    const refreshed = target.applyScoped(request);
    expect(refreshed).toBe(first);
    expect(first.finish('other')).toBe(true);
    expect(first.finish('other')).toBe(false);
    expect(target.applyScoped(request)).not.toBe(first);
  });
  it('uses each apply step definition only when creating its own runtime instance', () => {
    const container = new CombatBuffContainer('operator', new CombatAttributeSet<string>());
    const compiledEntries: CombatBuffDefinitionEntry[] = [];
    const target = new BuffDefinitionOperationTarget(container, {
      get: () => undefined,
      compile: entry => {
        compiledEntries.push(entry);
        return {
          id: entry.id,
          stackingType: entry.stackingType,
          durationSeconds: entry.durationSeconds,
        };
      },
    });

    const firstDefinition = {
      stackingType: 'refresh',
      durationSeconds: 5,
      presentation: { iconPath: '/icons/buffs/shared.webp' },
    } as const;
    const secondDefinition = { stackingType: 'refresh', durationSeconds: 9 } as const;
    target.apply({
      buffId: 'shared-key',
      definition: firstDefinition,
      sourceId: 'first',
      blackboardValues: {},
    });
    const instance = container.buffs[0]!;
    target.apply({
      buffId: 'shared-key',
      definition: secondDefinition,
      sourceId: 'second',
      blackboardValues: {},
    });

    expect(container.buffs).toHaveLength(1);
    expect(instance.definition.durationSeconds).toBe(5);
    expect(instance.definition.presentation).toEqual({
      iconPath: '/icons/buffs/shared.webp',
    });
    expect(instance.remainingDuration).toBe(9);
    // 展示元数据跟随最终运行时定义，但不会污染只负责战斗语义的外部定义编译器输入。
    expect(compiledEntries[0]).not.toHaveProperty('presentation');
  });

  it('resolves a stable identity and keeps application values on the created instance', () => {
    const attributes = new CombatAttributeSet<Attribute>();
    attributes.define('cost', 100, { minimum: 0, maximum: 100 });
    const container = new CombatBuffContainer('operator', attributes);
    const definition: CombatBuffDefinition<Attribute> = {
      id: 'free-skill',
      stackingType: 'unique',
      blackboard: { amount: -20 },
      attributeModifiers: [
        {
          attribute: 'cost',
          values: { slot: 'baseAddition', blackboardKey: 'amount' },
          timing: 'runtime',
        },
      ],
    };
    const target = new BuffDefinitionOperationTarget(container, {
      get: id => (id === definition.id ? definition : undefined),
    });

    expect(
      target.apply({
        buffId: 'free-skill',
        sourceId: 'operator',
        blackboardValues: { amount: -100 },
      }),
    ).toBe(true);
    expect(attributes.get('cost')).toBe(0);
  });

  it('keeps an inline dynamic max stack count until application blackboard resolution', () => {
    const container = new CombatBuffContainer('operator', new CombatAttributeSet<string>());
    const compiledEntries: CombatBuffDefinitionEntry[] = [];
    const target = new BuffDefinitionOperationTarget(container, {
      get: () => undefined,
      compile: entry => {
        compiledEntries.push(entry);
        return { id: entry.id, stackingType: entry.stackingType };
      },
    });
    const definition = {
      stackingType: 'stack',
      maxStackCount: { blackboardKey: 'max_stack' },
    } as const;

    for (let index = 0; index < 3; index += 1) {
      target.apply({
        buffId: 'dynamic-stack',
        definition,
        sourceId: 'operator',
        blackboardValues: { max_stack: 2 },
      });
    }

    expect(compiledEntries[0]).not.toHaveProperty('maxStackCount');
    expect(container.getCountById('dynamic-stack')).toBe(2);
  });

  it('rejects an unknown identity instead of creating an empty definition', () => {
    const target = new BuffDefinitionOperationTarget(
      new CombatBuffContainer('operator', new CombatAttributeSet()),
      {
        get: () => undefined,
        compile: entry => ({ id: entry.id, stackingType: entry.stackingType }),
      },
    );

    expect(() =>
      target.apply({ buffId: 'missing', sourceId: 'operator', blackboardValues: {} }),
    ).toThrow("unknown combat buff 'missing'");
  });

  it('advances the owned container with the shared combat frame interval', () => {
    const container = new CombatBuffContainer<never>('operator', new CombatAttributeSet<never>());
    const definition: CombatBuffDefinition<never> = {
      id: 'one-frame',
      stackingType: 'unique',
      durationSeconds: 1 / 30,
    };
    const target = new BuffDefinitionOperationTarget(container, {
      get: id => (id === definition.id ? definition : undefined),
    });

    target.apply({ buffId: definition.id, sourceId: 'operator', blackboardValues: {} });
    expect(container.getCountById(definition.id)).toBe(1);

    target.advanceFrame();
    expect(container.getCountById(definition.id)).toBe(0);
  });

  it('stores the supplied skill-cast snapshot on the created Buff instance', () => {
    const container = new CombatBuffContainer<never>('operator', new CombatAttributeSet<never>());
    const definition: CombatBuffDefinition<never> = {
      id: 'inherited-cast',
      stackingType: 'unique',
    };
    const target = new BuffDefinitionOperationTarget(container, {
      get: () => definition,
    });
    const skillCastInfo = {
      skillCastId: 3,
      originSkillId: 'battleSkill',
      originSkillType: 'battleSkill' as const,
      nonReturnedSpCost: 90,
    };

    target.apply({
      buffId: definition.id,
      sourceId: 'operator',
      blackboardValues: {},
      skillCastInfo,
    });

    expect(container.buffs[0]?.skillCastInfo).toEqual(skillCastInfo);
  });

  it('rejects lifecycle sequences until a Buff-owned sequence runtime is configured', () => {
    const target = new BuffDefinitionOperationTarget(
      new CombatBuffContainer('operator', new CombatAttributeSet()),
      {
        get: () => undefined,
        compile: entry => ({ id: entry.id, stackingType: entry.stackingType }),
      },
    );

    expect(() =>
      target.apply({
        buffId: 'active-buff',
        sourceId: 'operator',
        blackboardValues: {},
        definition: {
          stackingType: 'unique',
          lifecycleSequences: { start: { steps: [] } },
        },
      }),
    ).toThrow('no Buff sequence runtime is configured');
  });

  it('binds lifecycle definitions to the configured per-instance operation factory', () => {
    let executed = false;
    const lifecycleSources: unknown[] = [];
    const target = new BuffDefinitionOperationTarget(
      new CombatBuffContainer('operator', new CombatAttributeSet()),
      {
        get: () => undefined,
        compile: entry => ({ id: entry.id, stackingType: entry.stackingType }),
      },
    );
    target.configureLifecycleOperations(source => {
      lifecycleSources.push(source);
      return {
        execute: () => {
          executed = true;
          return true;
        },
        evaluate: () => true,
      };
    });

    expect(
      target.apply({
        buffId: 'active-buff',
        sourceId: 'support-operator',
        definitionOwnerId: 'definition-operator',
        sourceActionId: 'support-passive',
        blackboardValues: {},
        definition: {
          stackingType: 'unique',
          lifecycleSequences: {
            start: {
              steps: [
                {
                  kind: 'setContextFlag',
                  parameters: { flag: 'started', value: true, target: 'caster' },
                },
              ],
            },
          },
        },
      }),
    ).toBe(true);
    expect(executed).toBe(true);
    expect(lifecycleSources).toEqual([
      expect.objectContaining({
        ownerId: 'operator',
        sourceId: 'support-operator',
        definitionOwnerId: 'definition-operator',
        sourceActionId: 'support-passive',
      }),
    ]);
  });

  it('notifies the owner event boundary after a Buff is successfully applied', () => {
    const onBuffApplied = vi.fn();
    const target = new BuffDefinitionOperationTarget(
      new CombatBuffContainer('operator', new CombatAttributeSet()),
      {
        get: () => undefined,
        compile: entry => ({ id: entry.id, stackingType: entry.stackingType }),
      },
      undefined,
      undefined,
      onBuffApplied,
    );

    expect(
      target.apply({
        buffId: 'added-buff',
        sourceId: 'operator',
        blackboardValues: {},
        definition: { stackingType: 'unique' },
        iconDurationSourceTargetId: 'ability-entity:7',
      }),
    ).toBe(true);
    expect(onBuffApplied).toHaveBeenCalledWith(
      {
        targetId: 'operator',
        buffId: 'added-buff',
        sourceId: 'operator',
        buffTags: [],
        skillCastInfo: null,
        isExtra: false,
        iconDurationSourceTargetId: 'ability-entity:7',
      },
      target.container.getInstance(1),
    );
  });

  it('publishes before-output identity before attempting to create the Buff instance', () => {
    const container = new CombatBuffContainer('enemy', new CombatAttributeSet());
    const countsBeforeAttempt: number[] = [];
    const before = vi.fn(event => {
      countsBeforeAttempt.push(container.buffs.length);
      expect(event).toEqual({
        targetId: 'enemy',
        buffId: 'frozen',
        sourceId: 'yvonne',
        buffTags: ['Skill/Character/Common/SpellStatus/Frozen'],
        skillCastInfo: null,
        isExtra: false,
      });
    });
    const after = vi.fn();
    const output = vi.fn();
    const target = new BuffDefinitionOperationTarget(
      container,
      {
        get: () => undefined,
        compile: entry => ({
          id: entry.id,
          stackingType: entry.stackingType,
          applyTags: entry.applyTags,
        }),
      },
      undefined,
      undefined,
      after,
      before,
      output,
    );
    const request = {
      buffId: 'frozen',
      sourceId: 'yvonne',
      blackboardValues: {},
      definition: {
        stackingType: 'unique' as const,
        applyTags: ['Skill/Character/Common/SpellStatus/Frozen'],
      },
    };

    expect(target.apply(request)).toBe(true);
    expect(target.apply(request)).toBe(false);

    expect(before).toHaveBeenCalledTimes(2);
    expect(after).toHaveBeenCalledOnce();
    expect(output).toHaveBeenCalledOnce();
    expect(countsBeforeAttempt).toEqual([0, 1]);
  });

  it('publishes the exact successful Buff application through the native added callback', () => {
    const observer = vi.fn();
    const target = new BuffDefinitionOperationTarget(
      new CombatBuffContainer('operator', new CombatAttributeSet()),
      {
        get: () => undefined,
        compile: entry => ({ id: entry.id, stackingType: entry.stackingType }),
      },
      undefined,
      undefined,
      observer,
    );

    expect(
      target.apply({
        buffId: 'added-buff',
        sourceId: 'enemy',
        blackboardValues: {},
        definition: { stackingType: 'unique' },
      }),
    ).toBe(true);
    expect(observer).toHaveBeenCalledWith(
      {
        targetId: 'operator',
        buffId: 'added-buff',
        sourceId: 'enemy',
        buffTags: [],
        skillCastInfo: null,
        isExtra: false,
      },
      target.container.getInstance(1),
    );
    expect(observer).toHaveBeenCalledOnce();
  });

  it('registers an added-Buff response before publishing the successful application', () => {
    let handleAdded:
      | Parameters<import('./buffLifecycleSequenceRuntime').RegisterBuffAbilityEventAction>[2]
      | undefined;
    const execute = vi.fn(() => true);
    const target = new BuffDefinitionOperationTarget(
      new CombatBuffContainer('operator', new CombatAttributeSet()),
      {
        get: () => undefined,
        compile: entry => ({ id: entry.id, stackingType: entry.stackingType }),
      },
      undefined,
      (event, _priority, handle) => {
        expect(event).toBe('addedBuff');
        handleAdded = handle;
        return { dispose: vi.fn() };
      },
      payload => handleAdded?.({ event: 'addedBuff', payload }),
    );
    target.configureLifecycleOperations(() => ({ execute, evaluate: () => true }));

    expect(
      target.apply({
        buffId: 'listens-for-add',
        sourceId: 'operator',
        blackboardValues: {},
        definition: {
          stackingType: 'unique',
          abilityEventResponses: [
            {
              event: 'addedBuff',
              priority: 0,
              sequence: {
                steps: [
                  {
                    kind: 'setContextFlag',
                    parameters: { flag: 'added', value: true, target: 'caster' },
                  },
                ],
              },
            },
          ],
        },
      }),
    ).toBe(true);
    expect(execute).toHaveBeenCalledOnce();
  });

  it('preserves the dormant character-side spell-infliction response as its own event', () => {
    let handleInfliction:
      | Parameters<import('./buffLifecycleSequenceRuntime').RegisterBuffAbilityEventAction>[2]
      | undefined;
    const observed: unknown[] = [];
    // 响应结束会恢复上下文，必须在执行期间观察事件，不能检查 spy 保存的可变上下文引用。
    const execute = vi.fn(
      (_step: unknown, context?: import('../skills/skillRuntime').CombatOperationContext) => {
        observed.push(context?.event);
        return true;
      },
    );
    const target = new BuffDefinitionOperationTarget(
      new CombatBuffContainer('operator', new CombatAttributeSet()),
      {
        get: () => undefined,
        compile: entry => ({ id: entry.id, stackingType: entry.stackingType }),
      },
      undefined,
      (event, _priority, handle) => {
        expect(event).toBe('beforeTakeSpellInfliction');
        handleInfliction = handle;
        return { dispose: vi.fn() };
      },
    );
    target.configureLifecycleOperations(() => ({ execute, evaluate: () => true }));

    expect(
      target.apply({
        buffId: 'spell-infliction-listener',
        sourceId: 'operator',
        blackboardValues: {},
        definition: {
          stackingType: 'unique',
          abilityEventResponses: [
            {
              event: 'beforeTakeSpellInfliction',
              priority: 0,
              sequence: {
                steps: [
                  {
                    kind: 'setContextFlag',
                    parameters: { flag: 'inflicted', value: true, target: 'caster' },
                  },
                ],
              },
            },
          ],
        },
      }),
    ).toBe(true);

    handleInfliction?.({
      event: 'beforeTakeSpellInfliction',
      payload: { sourceId: 'enemy', targetId: 'operator' },
    });
    expect(execute).toHaveBeenCalledOnce();
    expect(observed).toEqual([
      {
        event: 'beforeTakeSpellInfliction',
        payload: { sourceId: 'enemy', targetId: 'operator' },
      },
    ]);
  });

  it('rejects configuring lifecycle operations more than once', () => {
    const target = new BuffDefinitionOperationTarget(
      new CombatBuffContainer('operator', new CombatAttributeSet()),
      { get: () => undefined },
    );
    const operations = { execute: () => true, evaluate: () => true };

    target.configureLifecycleOperations(() => operations);
    expect(() => target.configureLifecycleOperations(() => operations)).toThrow(
      'lifecycle operations are configured',
    );
  });
});
