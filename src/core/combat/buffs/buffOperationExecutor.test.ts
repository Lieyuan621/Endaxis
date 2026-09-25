import { createTestBuffReference } from './buffTestFixtures';
import type { GameplayTag } from '../../../../packages/game-data-contract/src/gameplayTags';
import { describe, expect, it, vi } from 'vitest';
import { CombatAttributeSet } from '../attributes/combatAttributes';
import { CombatBuffContainer } from './combatBuffs';
import { GameplayTagRegistry } from '../tags/gameplayTags';
import { ActionBlackboard } from '../actions/actionBlackboard';
import { CombatActionSequenceRuntime } from '../actions/combatActionSequenceRuntime';
import { BuffOperationExecutor, type BuffApplicationRequest } from './buffOperationExecutor';
import type { ResolvedSkillBuffDefinition } from '../../compiler/combatProgram';
import { BuffDefinitionOperationTarget } from './buffDefinitionOperationTarget';
import { RuntimeTargetContext } from '../abilities/runtimeTargetContext';
import type { CombatOperationExecutor } from '../skills/skillRuntime';
import { compileActionSequence } from '../../compiler/compileSkill';
import { validateSkillDefinition } from '../../game-data/validateSkillDefinition';
import type { ActionSequenceDefinition } from '../../../../packages/game-data-contract/src/actions';

const delegate: CombatOperationExecutor = {
  execute: () => false,
  evaluate: () => false,
};

describe('BuffOperationExecutor', () => {
  it('Buff 黑板查询与施加都使用动作输入目标，不误读 Buff 来源或迭代目标', () => {
    const recipient = Object.assign(new CombatBuffContainer('enemy', new CombatAttributeSet()), {
      apply: vi.fn(() => true),
    });
    recipient.add(
      { id: 'input-value', stackingType: 'unique', blackboard: { value: 8 } },
      'creator',
    );
    const executor = new BuffOperationExecutor({
      sourceId: 'creator',
      resolveTarget: () => {
        throw new Error('不得回退固定施法者');
      },
      resolveEventTarget: id => {
        expect(id).toBe('enemy');
        return recipient;
      },
      delegate,
    });
    const definition: ActionSequenceDefinition = {
      steps: [
        {
          kind: 'readBuffBlackboard',
          parameters: {
            target: 'actionInputTarget',
            query: { kind: 'id', buffIds: ['input-value'] },
            desiredKey: 'value',
            outputKey: 'read-value',
          },
        },
        {
          kind: 'applyBuff',
          parameters: { target: 'actionInputTarget', buffId: 'bonus' },
        },
      ],
    };
    const blackboard = new ActionBlackboard();
    const context = {
      blackboard,
      buffSourceId: 'creator',
      buffOwnerId: 'holder',
      currentTarget: { kind: 'operator' as const, operatorId: 'other' },
      actionInputTarget: { kind: 'enemy' as const },
    };
    expect(
      new CombatActionSequenceRuntime(executor, context)
        .createSequence(compileActionSequence(definition, 1))
        .executeInstant({}),
    ).toBe(true);
    expect(blackboard.getNumber('read-value')).toBe(8);
    expect(recipient.apply).toHaveBeenCalledOnce();
  });
  it.each([
    ['inline', false],
    ['catalog', false],
    ['inline', true],
    ['catalog', true],
  ] as const)('%s 定义仅在护盾读取来源属性时保留属性端口：%s', (lookup, shield) => {
    const definition: ResolvedSkillBuffDefinition = {
      stackingType: 'unlimited',
      ...(shield
        ? {
            shields: [
              {
                infinityValue: false,
                value: {
                  attributeSource: 'buffSource',
                  attribute: 'attack',
                  multiplier: 1,
                  addition: 0,
                },
                absorbCount: -1,
                absorbAllDamageWhenConsumed: false,
                removeBuffWhenConsumed: true,
                priority: 'normal',
                replaceHitEffect: false,
                damageAbsorptions: [],
              },
            ],
          }
        : {}),
    };
    const apply = vi.fn((_request: BuffApplicationRequest) => true);
    const target = Object.assign(new CombatBuffContainer('target', new CombatAttributeSet()), {
      apply,
    });
    const source = Object.assign(
      new CombatBuffContainer('ability-entity:1', new CombatAttributeSet()),
      {
        getAttributeValue: vi.fn(() => 400),
      },
    );
    const executor = new BuffOperationExecutor({
      sourceId: 'operator',
      resolveTarget: () => target,
      resolveEventTarget: () => {
        if (!shield) throw new Error('来源已经回收，不能索取活动 Buff 容器');
        return source;
      },
      resolveBuffDefinition: () => (lookup === 'catalog' ? definition : undefined),
      delegate,
    });
    executor.execute(
      {
        kind: 'applyBuff',
        parameters: {
          buffId: 'counter-or-shield',
          target: 'caster',
          source: 'buffSource',
          ...(lookup === 'inline' ? { definition } : {}),
        },
      },
      { blackboard: new ActionBlackboard(), buffSourceId: source.ownerId },
    );
    const request = apply.mock.calls[0]![0];
    expect(request.sourceId).toBe(source.ownerId);
    if (shield) {
      expect(request.sourceAttributeOwnerId).toBe(source.ownerId);
      expect(request.getSourceAttributeValue!('attack')).toBe(400);
    } else {
      expect(request).not.toHaveProperty('sourceAttributeOwnerId');
      expect(request).not.toHaveProperty('getSourceAttributeValue');
      expect(source.getAttributeValue).not.toHaveBeenCalled();
    }
  });
  it.each(['buffOwner', 'buffSource', 'currentTarget'] as const)(
    '标签结束目标 %s 通过定义校验、编译并结束绑定对象的 Buff',
    target => {
      const container = new CombatBuffContainer('recipient', new CombatAttributeSet());
      const applied = container.add(
        { id: 'tagged', stackingType: 'unlimited', applyTags: ['Test/Tag'] },
        'source',
      );
      const unrelated = container.add(
        { id: 'unrelated', stackingType: 'unlimited', applyTags: ['Test/Other'] },
        'source',
      );
      const sequence: ActionSequenceDefinition = {
        steps: [
          {
            kind: 'finishBuffsByTag',
            parameters: { target, buffTags: ['Test/Tag'], tagQueryType: 'hasAny', reason: 'early' },
          },
        ],
      };
      expect(
        validateSkillDefinition({
          key: 'finish',
          timelineBlockFrames: 1,
          scheduledSequences: [{ startFrame: 0, sequence }],
        }),
      ).toEqual([]);
      const step = compileActionSequence(sequence, 1).steps[0]!;
      if (step.kind !== 'finishBuffsByTag') throw new Error('unexpected compiled step');
      const executor = new BuffOperationExecutor({
        sourceId: 'caster',
        delegate,
        resolveTarget: () => {
          throw new Error('must use bound identity');
        },
        resolveEventTarget: id => {
          expect(id).toBe('recipient');
          return container;
        },
      });
      expect(
        executor.execute(step, {
          blackboard: new ActionBlackboard(),
          buffOwnerId: 'recipient',
          buffSourceId: 'recipient',
          currentTarget: { kind: 'operator', operatorId: 'recipient' },
        }),
      ).toBe(true);
      expect(applied?.finishReason).toBe('early');
      expect(unrelated?.isFinished).toBe(false);
    },
  );

  it('护盾当前值读取动作目标实时容器，而新增值读取事件且保留双精度', () => {
    let liveValue = 90.123456789;
    const container = new CombatBuffContainer('owner', new CombatAttributeSet());
    const target = new BuffDefinitionOperationTarget(container, { get: () => undefined });
    // Preserve the container methods while overriding only the live reader.
    Object.defineProperty(container, 'currentFiniteShieldValue', { get: () => liveValue });
    const executor = new BuffOperationExecutor({
      sourceId: 'source',
      resolveTarget: () => target,
      resolveEventTarget: id => {
        expect(id).toBe('owner');
        return target;
      },
      delegate,
    });
    const blackboard = new ActionBlackboard({ shield: 7 });
    const context = {
      blackboard,
      actionOwnerId: 'owner',
      event: {
        event: 'afterAddedShield' as const,
        payload: {
          sourceId: 'other',
          targetId: 'other',
          gainedValue: 33.123456789,
          currentValue: 999,
        },
      },
    };
    const step = (value: 'gained' | 'current') => ({
      kind: 'storeShieldValue' as const,
      parameters: { target: 'actionOwner' as const, value, outputKey: 'shield' },
    });
    expect(executor.execute(step('current'), context)).toBe(true);
    expect(blackboard.getNumber('shield')).toBe(liveValue);
    liveValue = 80.123456789;
    executor.execute(step('current'), { blackboard, actionOwnerId: 'owner' });
    expect(blackboard.getNumber('shield')).toBe(liveValue);
    executor.execute(step('gained'), context);
    expect(blackboard.getNumber('shield')).toBe(33.123456789);
    expect(executor.execute(step('gained'), { blackboard, actionOwnerId: 'owner' })).toBe(true);
    expect(executor.execute(step('gained'), { blackboard, event: context.event })).toBe(true);
    expect(blackboard.getNumber('shield')).toBe(33.123456789);
  });
  it.each([false, true])('结束动作传递自身施法而非事件施法，存在来源=%s', hasSource => {
    const target = new CombatBuffContainer<string>('caster', new CombatAttributeSet());
    const finish = vi.spyOn(target, 'finishByIds');
    const executor = new BuffOperationExecutor({
      sourceId: 'caster',
      resolveTarget: () => target,
      delegate,
    });
    const source = {
      skillCastId: 1,
      originSkillId: 'host',
      originSkillType: 'battleSkill' as const,
      nonReturnedSpCost: 100,
    };
    executor.execute(
      {
        kind: 'finishBuffsById',
        parameters: { target: 'caster', buffIds: ['buff'], reason: 'other' },
      },
      {
        blackboard: new ActionBlackboard(),
        ...(hasSource ? { skillCastInfo: source } : {}),
        eventSkillCastInfo: { ...source, skillCastId: 2, originSkillId: 'event' },
      },
    );
    expect(finish).toHaveBeenCalledWith(['buff'], 'other', 'caster', hasSource ? source : null);
  });
  it.each([false, true])('CreateBuff继承动作环境而非触发事件，宿主来源存在=%s', hasHost => {
    const apply = vi.fn((_request: unknown) => true);
    const target = Object.assign(new CombatBuffContainer('caster', new CombatAttributeSet()), {
      apply,
    });
    const executor = new BuffOperationExecutor({
      sourceId: 'caster',
      resolveTarget: () => target,
      delegate,
    });
    const host = {
      skillCastId: 7,
      originSkillId: 'battle',
      originSkillType: 'battleSkill' as const,
      nonReturnedSpCost: 100,
    };
    const event = {
      skillCastId: 9,
      originSkillId: 'a4',
      originSkillType: 'basicAttack' as const,
      nonReturnedSpCost: 0,
    };
    for (const eventSkillCastInfo of [undefined, null, event]) {
      for (const inheritSourceSkillCastInfo of [false, true]) {
        apply.mockClear();
        executor.execute(
          {
            kind: 'applyBuff',
            parameters: { buffId: 'phantom', target: 'caster', inheritSourceSkillCastInfo },
          },
          {
            blackboard: new ActionBlackboard(),
            ...(hasHost ? { skillCastInfo: host } : {}),
            ...(eventSkillCastInfo === undefined ? {} : { eventSkillCastInfo }),
          },
        );
        expect(apply).toHaveBeenCalledOnce();
        expect(apply.mock.calls[0]![0]).toMatchObject({ sourceId: 'caster' });
        expect((apply.mock.calls[0]![0] as { skillCastInfo?: unknown }).skillCastInfo).toEqual(
          hasHost && inheritSourceSkillCastInfo ? host : undefined,
        );
      }
    }
  });
  it('按 ID 结束未存在的实例不要求装载该 Buff 定义', () => {
    const target = new CombatBuffContainer('caster', new CombatAttributeSet());
    const finish = vi.spyOn(target, 'finishByIds');
    const executor = new BuffOperationExecutor({
      sourceId: 'caster',
      resolveTarget: () => target,
      delegate,
    });
    expect(
      executor.execute({
        kind: 'finishBuffsById',
        parameters: { target: 'caster', buffIds: ['missing'], reason: 'other' },
      }),
    ).toBe(true);
    expect(finish).toHaveReturnedWith(0);
  });
  it.each([
    [{ kind: 'operator', operatorId: 'recipient' }, 'recipient'],
    [{ kind: 'enemy' }, 'enemy'],
    [{ kind: 'abilityEntity', instanceId: 7 }, 'ability-entity:7'],
  ] as const)('Context 接收者 %j 与 Context 来源保持独立', (currentTarget, targetId) => {
    const apply = vi.fn(() => true);
    const recipient = Object.assign(new CombatBuffContainer(targetId, new CombatAttributeSet()), {
      apply,
    });
    const source = new CombatBuffContainer('source', new CombatAttributeSet());
    const targetContext = new RuntimeTargetContext();
    targetContext.set('source', [{ kind: 'operator', operatorId: 'source' }]);
    const executor = new BuffOperationExecutor({
      sourceId: 'definition-owner',
      resolveTarget: () => {
        throw new Error('must not substitute caster or enemy');
      },
      resolveEventTarget: id =>
        id === 'source'
          ? source
          : id === targetId
            ? recipient
            : (() => {
                throw new Error(`unexpected target ${id}`);
              })(),
      delegate,
    });
    executor.execute(
      {
        kind: 'applyBuff',
        parameters: { buffId: 'child', target: 'currentTarget', sourceContextKey: 'source' },
      },
      {
        blackboard: new ActionBlackboard(),
        targetContext,
        currentTarget,
        buffSourceId: 'original-source',
      },
    );
    expect(apply).toHaveBeenCalledOnce();
    expect(apply).toHaveBeenCalledWith(
      expect.objectContaining({ sourceId: 'source', definitionOwnerId: 'definition-owner' }),
    );
  });
  it.each([
    [{ kind: 'operator', operatorId: 'queried' }, 'queried'],
    [{ kind: 'enemy' }, 'enemy'],
    [{ kind: 'abilityEntity', instanceId: 7 }, 'ability-entity:7'],
  ] as const)('结束 Buff 使用 Context 当前实例：%j', (currentTarget, expectedId) => {
    const target = new CombatBuffContainer(expectedId, new CombatAttributeSet());
    const finish = vi.spyOn(target, 'finishByIds');
    const resolve = vi.fn(() => target);
    const executor = new BuffOperationExecutor({
      sourceId: 'original',
      resolveTarget: () => {
        throw new Error('must not resolve original source');
      },
      resolveEventTarget: resolve,
      delegate,
    });
    executor.execute(
      {
        kind: 'finishBuffsById',
        parameters: { target: 'currentTarget', buffIds: ['buff.fixture'], reason: 'other' },
      },
      { blackboard: new ActionBlackboard(), currentTarget, buffSourceId: 'original' },
    );
    expect(resolve).toHaveBeenCalledWith(expectedId);
    expect(finish).toHaveBeenCalledWith(['buff.fixture'], 'other', 'original', null);
  });
  it('Context 来源使用已查询身份，不取原 Buff 来源或受益干员', () => {
    const apply = vi.fn(() => true);
    const receiver = Object.assign(new CombatBuffContainer('receiver', new CombatAttributeSet()), {
      apply,
    });
    const caster = new CombatBuffContainer('xaihi', new CombatAttributeSet());
    const targetContext = new RuntimeTargetContext();
    targetContext.set('seraph', [{ kind: 'operator', operatorId: 'xaihi' }]);
    const executor = new BuffOperationExecutor({
      sourceId: 'receiver',
      resolveTarget: () => receiver,
      resolveEventTarget: id => {
        expect(id).toBe('xaihi');
        return caster;
      },
      delegate,
    });
    const step = {
      kind: 'applyBuff' as const,
      parameters: { buffId: 'child', target: 'caster' as const, sourceContextKey: 'seraph' },
    };
    const context = {
      blackboard: new ActionBlackboard(),
      targetContext,
      buffSourceId: 'ability-entity:3',
    };
    executor.execute(step, context);
    expect(apply).toHaveBeenCalledWith(expect.objectContaining({ sourceId: 'xaihi' }));
    targetContext.set('seraph', []);
    expect(() => executor.execute(step, context)).toThrow('exactly one target');
  });
  it.each([
    [undefined, undefined, 'receiver'],
    ['ability-entity:3', undefined, 'ability-entity:3'],
    ['ability-entity:3', 'enhancer', 'enhancer'],
  ] as const)(
    '默认来源使用动作上下文而非宿主：%s / %s',
    (buffSourceId, actionSourceId, expected) => {
      const apply = vi.fn(() => true);
      const receiver = Object.assign(
        new CombatBuffContainer('receiver', new CombatAttributeSet()),
        { apply },
      );
      const executor = new BuffOperationExecutor({
        sourceId: 'receiver',
        resolveTarget: () => receiver,
        delegate,
      });
      executor.execute(
        { kind: 'applyBuff', parameters: { buffId: 'child', target: 'caster' } },
        {
          blackboard: new ActionBlackboard(),
          buffOwnerId: 'receiver',
          buffSourceId,
          actionSourceId,
        },
      );
      expect(apply).toHaveBeenCalledWith(expect.objectContaining({ sourceId: expected }));
    },
  );

  it('把能力实体 ActionOwner 解析为只读图标倒计时来源', () => {
    const apply = vi.fn(() => true);
    const receiver = Object.assign(new CombatBuffContainer('enemy', new CombatAttributeSet()), {
      apply,
    });
    const executor = new BuffOperationExecutor({
      sourceId: 'operator',
      resolveTarget: () => receiver,
      delegate,
    });
    const step = {
      kind: 'applyBuff' as const,
      parameters: {
        buffId: 'weakness',
        target: 'enemy' as const,
        iconDurationSource: { kind: 'actionOwnerAbilityEntity' as const },
      },
    };

    expect(() => executor.execute(step, { blackboard: new ActionBlackboard() })).toThrow(
      'requires an AbilityEntity action owner',
    );
    executor.execute(step, {
      blackboard: new ActionBlackboard(),
      actionOwnerAbilityEntity: { kind: 'abilityEntity', instanceId: 7 },
    });
    expect(apply).toHaveBeenCalledWith(
      expect.objectContaining({ iconDurationSourceTargetId: 'ability-entity:7' }),
    );
  });

  it('把能力实体上的同名 TimedMarker 解析为具体实例的展示时钟', () => {
    const apply = vi.fn(() => true);
    const receiver = Object.assign(new CombatBuffContainer('enemy', new CombatAttributeSet()), {
      apply,
    });
    const resolveAbilityEntityTimedMarkerSource = vi.fn(() => 'abilityEntity:7:timed-marker:3');
    const executor = new BuffOperationExecutor({
      sourceId: 'operator',
      resolveTarget: () => receiver,
      resolveAbilityEntityTimedMarkerSource,
      delegate,
    });
    const step = {
      kind: 'applyBuff' as const,
      parameters: {
        buffId: 'weakness',
        target: 'enemy' as const,
        iconDurationSource: {
          kind: 'actionOwnerTimedMarker' as const,
          markerId: 'ultimate-window',
        },
      },
    };
    const actionOwnerAbilityEntity = { kind: 'abilityEntity' as const, instanceId: 7 };

    executor.execute(step, {
      blackboard: new ActionBlackboard(),
      actionOwnerAbilityEntity,
    });

    expect(resolveAbilityEntityTimedMarkerSource).toHaveBeenCalledWith(
      actionOwnerAbilityEntity,
      'ultimate-window',
    );
    expect(apply).toHaveBeenCalledWith(
      expect.objectContaining({
        iconDurationSourceTargetId: 'abilityEntity:7:timed-marker:3',
      }),
    );
  });

  it('缺少同名 TimedMarker 时不伪造展示时长', () => {
    const receiver = Object.assign(new CombatBuffContainer('enemy', new CombatAttributeSet()), {
      apply: vi.fn(() => true),
    });
    const executor = new BuffOperationExecutor({
      sourceId: 'operator',
      resolveTarget: () => receiver,
      resolveAbilityEntityTimedMarkerSource: () => undefined,
      delegate,
    });

    expect(() =>
      executor.execute(
        {
          kind: 'applyBuff',
          parameters: {
            buffId: 'weakness',
            target: 'enemy',
            iconDurationSource: {
              kind: 'actionOwnerTimedMarker',
              markerId: 'missing',
            },
          },
        },
        {
          blackboard: new ActionBlackboard(),
          actionOwnerAbilityEntity: { kind: 'abilityEntity', instanceId: 7 },
        },
      ),
    ).toThrow("AbilityEntity TimedMarker 'missing' is not active");
  });

  it('关键词增强只合入本次创建的载体实例并在父动作黑板求值', () => {
    const apply = vi.fn(() => true);
    const receiver = Object.assign(new CombatBuffContainer('operator', new CombatAttributeSet()), {
      apply,
    });
    const baseDefinition = { stackingType: 'unlimited' as const };
    const executor = new BuffOperationExecutor({
      sourceId: 'operator',
      resolveTarget: () => receiver,
      resolveBuffDefinition: id => (id === 'carrier' ? baseDefinition : undefined),
      delegate,
    });
    executor.execute(
      {
        kind: 'applyBuff',
        parameters: {
          buffId: 'carrier',
          target: 'caster',
          blackboardAssignments: {
            rate: { kind: 'blackboard', key: 'base_rate' },
          },
          keywordEnhancements: [
            {
              triggerBuffIds: ['trigger'],
              operation: 'add',
              value: { kind: 'blackboard', key: 'bonus' },
            },
          ],
        },
      },
      { blackboard: new ActionBlackboard({ base_rate: 0.2, bonus: 0.05 }) },
    );
    expect(apply).toHaveBeenCalledWith(
      expect.objectContaining({
        blackboardValues: { rate: 0.2 },
        definition: {
          stackingType: 'unlimited',
          keywordEnhancements: [
            {
              triggerBuffIds: ['trigger'],
              operation: 'add',
              targetKey: 'rate',
              initialValue: { blackboardKey: 'rate' },
              value: 0.05,
            },
          ],
        },
      }),
    );
    expect(baseDefinition).toEqual({ stackingType: 'unlimited' });
  });

  it.each(['tag', 'id', 'repeated-id'] as const)(
    '原生默认 %s 读增强层数，排除结束实例并保留重复 ID 求和',
    kind => {
      const path = 'buff/test/enhanced';
      const tag = path;
      const target = new CombatBuffContainer(
        'enemy',
        new CombatAttributeSet(),
        new GameplayTagRegistry([path]),
      );
      const definition = { id: 'layer', stackingType: 'enhance' as const, applyTags: [tag] };
      for (let index = 0; index < 3; index++) target.add(definition, 'operator');
      target
        .add({ id: 'ended', stackingType: 'unlimited', applyTags: [tag] }, 'operator')!
        .finish('other');
      const blackboard = new ActionBlackboard({ count: -1 });
      const executor = new BuffOperationExecutor({
        sourceId: 'operator',
        resolveTarget: () => target,
        delegate,
      });
      expect(
        executor.execute(
          {
            kind: 'readBuffStackCount',
            parameters: {
              target: 'enemy',
              outputKey: 'count',
              query:
                kind === 'tag'
                  ? { kind: 'tag', tagQueryType: 'hasAny', buffTags: [tag] }
                  : {
                      kind: 'id',
                      buffIds: kind === 'id' ? ['layer', 'ended'] : ['layer', 'layer', 'ended'],
                    },
            },
          },
          { blackboard },
        ),
      ).toBe(true);
      expect(blackboard.getNumber('count')).toBe(kind === 'repeated-id' ? 6 : 3);
    },
  );

  it.each(['buffSource', 'buffOwner'] as const)(
    '显式 %s 来源不被当前事件施加者覆盖，缺上下文拒绝执行',
    sourceKind => {
      const owner = new CombatBuffContainer('enemy', new CombatAttributeSet());
      const source = new CombatBuffContainer('weapon-holder', new CombatAttributeSet());
      const apply = vi.fn(() => true);
      const receiver = Object.assign(
        new CombatBuffContainer('receiver', new CombatAttributeSet()),
        { apply },
      );
      const executor = new BuffOperationExecutor({
        sourceId: 'wrong-default',
        resolveTarget: () => receiver,
        resolveEventTarget: id => {
          if (id === owner.ownerId) return owner;
          if (id === source.ownerId) return source;
          throw new Error(`unexpected entity ${id}`);
        },
        delegate,
      });
      const step = {
        kind: 'applyBuff' as const,
        parameters: { buffId: 'child', target: 'caster' as const, source: sourceKind },
      };
      const context = {
        blackboard: new ActionBlackboard(),
        buffOwnerId: owner.ownerId,
        buffSourceId: source.ownerId,
        event: {
          event: 'addedBuff' as const,
          payload: {
            sourceId: 'teammate',
            targetId: 'enemy',
            buffId: 'corrosion',
            buffTags: [],
          },
        },
      };
      expect(executor.execute(step, context)).toBe(true);
      expect(apply).toHaveBeenCalledWith(
        expect.objectContaining({
          sourceId: sourceKind === 'buffSource' ? 'weapon-holder' : 'enemy',
        }),
      );
      expect(() =>
        executor.execute(step, { blackboard: context.blackboard, event: context.event }),
      ).toThrow('Buff lifecycle context');
    },
  );

  it.each([false, true])(
    'never drops cast attachment when falling back to legacy application (%s)',
    legacy => {
      const execute = vi.fn(() => true);
      const executor = new BuffOperationExecutor({
        sourceId: 'operator',
        resolveTarget: () => new CombatBuffContainer('operator', new CombatAttributeSet()),
        delegate: { ...delegate, execute },
      });
      expect(() =>
        executor.execute({
          kind: 'applyBuff',
          parameters: {
            buffId: 'attached',
            target: 'caster',
            lifetimeOwner: 'currentCastSkill',
            ...(legacy ? { durationSeconds: 10 } : {}),
          },
        }),
      ).toThrow(legacy ? 'definition-backed Buff handle' : 'scoped Buff application port');
      expect(execute).not.toHaveBeenCalled();
    },
  );
  it('compares matching Buff instances on the real event target without counting enhance layers', () => {
    const path = 'buff/status/poise';
    const tag = path;
    const target = new CombatBuffContainer(
      'enemy',
      new CombatAttributeSet(),
      new GameplayTagRegistry([path]),
    );
    target.add({ id: 'enhanced', stackingType: 'enhance', applyTags: [tag] }, 'operator');
    target.add({ id: 'enhanced', stackingType: 'enhance', applyTags: [tag] }, 'operator');
    target.add({ id: 'separate', stackingType: 'unlimited', applyTags: [tag] }, 'operator');
    const executor = new BuffOperationExecutor({
      sourceId: 'operator',
      resolveTarget: () => target,
      resolveEventTarget: targetId => {
        expect(targetId).toBe('enemy');
        return target;
      },
      delegate,
    });
    const context = {
      blackboard: new ActionBlackboard({ required: 2 }),
      event: {
        event: 'addedBuff' as const,
        payload: {
          targetId: 'enemy',
          sourceId: 'operator',
          buffId: 'latest',
          buffTags: [tag],
        },
      },
    };

    expect(
      executor.evaluate(
        {
          kind: 'eventTargetBuffCountCompare',
          tagQueryType: 'hasAny',
          buffTags: [tag],
          operator: 'greaterOrEqual',
          value: { kind: 'blackboard', key: 'required' },
        },
        context,
      ),
    ).toBe(true);
    context.blackboard.assignDynamic('required', 3);
    expect(
      executor.evaluate(
        {
          kind: 'eventTargetBuffCountCompare',
          tagQueryType: 'hasAny',
          buffTags: [tag],
          operator: 'greaterOrEqual',
          value: { kind: 'blackboard', key: 'required' },
        },
        context,
      ),
    ).toBe(false);
  });

  it('applies the first no-guard layer before executing the fracture Buff chain', () => {
    let noGuardCount = 0;
    const applied: string[] = [];
    const beforeOutput: Array<
      import('../events/combatAbilityEvent').AbilityPhysicalInflictionPayload
    > = [];
    const target = {
      ownerId: 'enemy',
      apply: (request: { buffId: string }) => {
        applied.push(request.buffId);
        if (request.buffId === 'buff_physical_no_guard') noGuardCount += 1;
        if (request.buffId === 'buff_physical_fracture') noGuardCount = 0;
        return true;
      },
      getCountByIds: (ids: readonly string[]) =>
        ids.includes('buff_physical_no_guard') ? noGuardCount : 0,
      finishByIds: () => 0,
      holdByIds: () => ({ release: () => undefined }),
      getCountByTags: () => 0,
      matchesEntityTags: () => false,
      findFirstByIds: () => undefined,
      findFirstByTags: () => undefined,
      finishByTags: () => 0,
    };
    const executor = new BuffOperationExecutor({
      sourceId: 'antal',
      sourceActionId: 'comboSkill',
      resolveTarget: () => target,
      onBeforeOutputPhysicalInfliction: event => beforeOutput.push(event),
      delegate,
    });
    const step = {
      kind: 'applyPhysicalInfliction' as const,
      parameters: {
        type: 'fracture' as const,
        target: 'enemy' as const,
        isExtra: false,
        noGuardBuffId: 'buff_physical_no_guard',
        noGuardDefinition: { stackingType: 'unlimited' as const },
        fractureBuffId: 'buff_physical_fracture',
        fractureDefinition: { stackingType: 'refresh' as const },
      },
    };
    const attachBuffToCurrentSkill = vi.fn();
    const context = {
      blackboard: new ActionBlackboard(),
      attachBuffToCurrentSkill,
      skillCastInfo: {
        skillCastId: 1,
        originSkillId: 'comboSkill',
        originSkillType: 'comboSkill' as const,
        nonReturnedSpCost: 0,
      },
    };

    expect(executor.execute(step, context)).toBe(true);
    expect(executor.execute(step, context)).toBe(true);
    expect(beforeOutput).toEqual([
      {
        sourceId: 'antal',
        targetId: 'enemy',
        type: 'fracture',
        skillCastInfo: context.skillCastInfo,
        attachBuffToCurrentSkill,
      },
    ]);
    expect(applied).toEqual(['buff_physical_no_guard', 'buff_physical_fracture']);
    // 此处是只模拟层数的目标；消费事件由真实 Buff 容器负责，不能在此反推。
  });

  it('applies Airborne through its force/no-guard gate without pretending stump control success', () => {
    let noGuardCount = 0;
    const applied: string[] = [];
    const beforeOutput: Array<string | undefined> = [];
    const target = {
      ownerId: 'enemy',
      apply: (request: { buffId: string }) => {
        applied.push(request.buffId);
        if (request.buffId === 'buff_physical_no_guard') noGuardCount += 1;
        return true;
      },
      getCountByIds: (ids: readonly string[]) =>
        ids.includes('buff_physical_no_guard') ? noGuardCount : 0,
      finishByIds: () => 0,
      holdByIds: () => ({ release: () => undefined }),
      getCountByTags: () => 0,
      matchesEntityTags: () => false,
      findFirstByIds: () => undefined,
      findFirstByTags: () => undefined,
      finishByTags: () => 0,
    };
    const executor = new BuffOperationExecutor({
      sourceId: 'antal',
      resolveTarget: () => target,
      onBeforeOutputPhysicalInfliction: event => beforeOutput.push(event.type),
      delegate,
    });
    const parameters = {
      type: 'airborne' as const,
      target: 'enemy' as const,
      isExtra: false,
      noGuardBuffId: 'buff_physical_no_guard',
      noGuardDefinition: { stackingType: 'enhanceAndRefresh' as const },
      airborneBuffId: 'buff_physical_airborne',
      airborneDefinition: { stackingType: 'refresh' as const },
      duration: { kind: 'constant' as const, value: 1.5 },
      height: { kind: 'constant' as const, value: 2 },
      speedFactorMultiplier: 3,
      force: false,
      targetFilter: 'aliveOnly' as const,
      returnWhen: 'always' as const,
    };
    const context = {
      blackboard: new ActionBlackboard(),
      skillCastInfo: {
        skillCastId: 1,
        originSkillId: 'comboSkill',
        originSkillType: 'comboSkill' as const,
        nonReturnedSpCost: 0,
      },
    };

    expect(executor.execute({ kind: 'applyPhysicalInfliction', parameters }, context)).toBe(true);
    expect(beforeOutput).toEqual([]);
    expect(executor.execute({ kind: 'applyPhysicalInfliction', parameters }, context)).toBe(true);
    expect(beforeOutput).toEqual(['airborne']);
    expect(applied).toEqual(['buff_physical_no_guard', 'buff_physical_airborne']);

    expect(
      executor.execute(
        {
          kind: 'applyPhysicalInfliction',
          parameters: { ...parameters, force: true, returnWhen: 'success' },
        },
        context,
      ),
    ).toBe(false);
    expect(applied.at(-1)).toBe('buff_physical_airborne');
  });

  it('resolves Crush assignments only when the existing no-guard layer is consumed', () => {
    let noGuardCount = 1;
    const applied: import('./buffOperationExecutor').BuffApplicationRequest[] = [];
    const target = {
      ownerId: 'enemy',
      apply: (request: import('./buffOperationExecutor').BuffApplicationRequest) => {
        applied.push(request);
        if (request.buffId === 'buff_physical_crushed') noGuardCount = 0;
        return true;
      },
      getCountByIds: (ids: readonly string[]) =>
        ids.includes('buff_physical_no_guard') ? noGuardCount : 0,
      finishByIds: () => 0,
      holdByIds: () => ({ release: () => undefined }),
      getCountByTags: () => 0,
      matchesEntityTags: () => false,
      findFirstByIds: () => undefined,
      findFirstByTags: () => undefined,
      finishByTags: () => 0,
    };
    const executor = new BuffOperationExecutor({
      sourceId: 'dapan',
      resolveTarget: () => target,
      delegate,
    });

    expect(
      executor.execute(
        {
          kind: 'applyPhysicalInfliction',
          parameters: {
            type: 'crush',
            target: 'enemy',
            isExtra: false,
            noGuardBuffId: 'buff_physical_no_guard',
            noGuardDefinition: { stackingType: 'enhanceAndRefresh' },
            crushedBuffId: 'buff_physical_crushed',
            crushedDefinition: { stackingType: 'stack', stackingKey: 'physical' },
            damageMultiplier: { kind: 'blackboard', key: 'crush_multi' },
            ignoreHitEffect: true,
          },
        },
        {
          blackboard: new ActionBlackboard({ crush_multi: 1.75 }),
          skillCastInfo: {
            skillCastId: 1,
            originSkillId: 'combo',
            originSkillType: 'comboSkill',
            nonReturnedSpCost: 0,
          },
        },
      ),
    ).toBe(true);
    expect(applied).toEqual([
      expect.objectContaining({
        buffId: 'buff_physical_crushed',
        blackboardValues: { dmg_multiplier: 1.75, ignore_hit_effect: 1 },
      }),
    ]);
  });

  it('finishes only Buff instances created for the active action interval', () => {
    const finished: string[] = [];
    const target = {
      ownerId: 'enemy',
      applyScoped: () => ({
        isRecycled: false,
        reference: createTestBuffReference(),
        finish: (reason: string) => {
          finished.push(reason);
          return true;
        },
      }),
      getCountByIds: () => 0,
      finishByIds: () => 0,
      holdByIds: () => ({ release: () => undefined }),
      getCountByTags: () => 0,
      matchesEntityTags: () => false,
      findFirstByIds: () => undefined,
      findFirstByTags: () => undefined,
      finishByTags: () => 0,
    };
    const executor = new BuffOperationExecutor({
      sourceId: 'operator',
      resolveTarget: () => target,
      delegate,
    });
    const step = {
      kind: 'applyBuff' as const,
      parameters: {
        buffId: 'aura-buff',
        target: 'enemy' as const,
        finishByAction: true,
      },
    };
    const actionBuffReferencesState = { active: false, references: [] };

    expect(
      executor.execute(step, { blackboard: new ActionBlackboard(), actionBuffReferencesState }),
    ).toBe(true);
    expect(finished).toEqual([]);

    executor.end(step, { blackboard: new ActionBlackboard(), actionBuffReferencesState });
    expect(finished).toEqual(['other']);
  });

  it('Aura 结束先回收创建的实例，再清理指定 Owner，而不是对离场目标查同名 Buff', () => {
    const calls: string[] = [];
    const target = {
      ownerId: 'enemy',
      applyScoped: () => ({
        isRecycled: false,
        reference: createTestBuffReference(),
        finish: () => {
          calls.push('instance');
          return true;
        },
      }),
      finishByIds: () => {
        calls.push('target');
        return 0;
      },
      getCountByIds: () => 0,
      holdByIds: () => ({ release: () => undefined }),
      getCountByTags: () => 0,
      matchesEntityTags: () => false,
      findFirstByIds: () => undefined,
      findFirstByTags: () => undefined,
      finishByTags: () => 0,
    };
    const owner = {
      ...target,
      ownerId: 'operator',
      finishByIds: () => {
        calls.push('owner');
        return 0;
      },
    };
    const executor = new BuffOperationExecutor({
      sourceId: 'operator',
      resolveTarget: recipient => (recipient === 'caster' ? owner : target),
      delegate,
    });
    const step = {
      kind: 'applyBuff' as const,
      parameters: {
        buffId: 'aura',
        target: 'enemy' as const,
        finishByAction: true,
        onActionEndFinishBuffs: { target: 'caster' as const, buffIds: ['aura'] },
      },
    };
    const context = {
      blackboard: new ActionBlackboard(),
      actionBuffReferencesState: { active: false, references: [] },
    };
    executor.execute(step, context);
    expect(calls).toEqual([]);
    executor.end(step, context);
    expect(calls).toEqual(['instance', 'owner']);
  });

  it('transfers the same action-duration Buff handle only to an allowed next native skill', () => {
    const finish = vi.fn(() => true);
    const handle = { isRecycled: false, reference: createTestBuffReference(), finish };
    const target = {
      ownerId: 'ability-entity',
      applyScoped: () => handle,
      getCountByIds: () => 0,
      finishByIds: () => 0,
      holdByIds: () => ({ release: () => undefined }),
      getCountByTags: () => 0,
      matchesEntityTags: () => false,
      findFirstByIds: () => undefined,
      findFirstByTags: () => undefined,
      finishByTags: () => 0,
    };
    const executor = new BuffOperationExecutor({
      sourceId: 'operator',
      resolveTarget: () => target,
      delegate,
    });
    const step = {
      kind: 'applyBuff' as const,
      parameters: {
        buffId: 'cancel-entity',
        target: 'caster' as const,
        finishByAction: true,
        inheritToNextSkillIds: ['native.attack1'],
      },
    };
    const detachBuffFromCurrentSkill = vi.fn();
    const attachBuffToNextSkill = vi.fn();
    const actionBuffReferencesState = { active: false, references: [] };

    executor.execute(step, { blackboard: new ActionBlackboard(), actionBuffReferencesState });
    executor.end(step, {
      blackboard: new ActionBlackboard(),
      actionBuffReferencesState,
      pendingNextSkillId: 'native.attack1',
      detachBuffFromCurrentSkill,
      attachBuffToNextSkill,
    });

    expect(detachBuffFromCurrentSkill).toHaveBeenCalledExactlyOnceWith(handle);
    expect(attachBuffToNextSkill).toHaveBeenCalledExactlyOnceWith(handle);
    expect(finish).not.toHaveBeenCalled();
  });

  it.each([false, true])(
    'restores an action-duration Buff reference, already recycled=%s',
    recycled => {
      const reference = createTestBuffReference();
      const oldFinish = vi.fn(() => true);
      const oldHandle = { isRecycled: false, reference, finish: oldFinish, isFinished: false };
      const step = {
        kind: 'applyBuff' as const,
        parameters: {
          buffId: 'branch-aura',
          target: 'enemy' as const,
          finishByAction: true,
        },
      };
      const originalState = { active: false, references: [] };
      const original = new BuffOperationExecutor({
        sourceId: 'operator',
        resolveBuffReference: saved => {
          expect(saved).toEqual(reference);
          return recycled ? undefined : oldHandle;
        },
        resolveTarget: () => ({
          ownerId: reference.ownerId,
          applyScoped: () => oldHandle,
          getCountByIds: () => 0,
          finishByIds: () => 0,
          holdByIds: () => ({ release: () => undefined }),
          getCountByTags: () => 0,
          matchesEntityTags: () => false,
          findFirstByIds: () => undefined,
          findFirstByTags: () => undefined,
          finishByTags: () => 0,
        }),
        delegate,
      });
      original.execute(step, {
        blackboard: new ActionBlackboard(),
        actionBuffReferencesState: originalState,
      });

      const restoredState = structuredClone(originalState);
      oldHandle.isFinished = recycled;
      oldHandle.isRecycled = recycled;
      const newFinish = vi.fn(() => true);
      const newHandle = { isRecycled: false, reference, finish: newFinish };
      const restored = new BuffOperationExecutor({
        sourceId: 'operator',
        resolveTarget: () => {
          throw new Error('restored End must resolve the saved owner identity');
        },
        resolveEventTarget: () => {
          throw new Error('old references must not require a live owner target');
        },
        resolveBuffReference: saved => {
          expect(saved).toEqual(reference);
          return recycled ? undefined : newHandle;
        },
        delegate,
      });

      restored.end(step, {
        blackboard: new ActionBlackboard(),
        actionBuffReferencesState: restoredState,
      });

      if (recycled) expect(newFinish).not.toHaveBeenCalled();
      else expect(newFinish).toHaveBeenCalledExactlyOnceWith('other');
      expect(oldFinish).not.toHaveBeenCalled();
      expect(restoredState).toEqual({ active: false, references: [] });
      expect(originalState).toEqual({ active: true, references: [reference] });
      original.end(step, {
        blackboard: new ActionBlackboard(),
        actionBuffReferencesState: originalState,
      });
      expect(originalState).toEqual(restoredState);
      expect(oldFinish).toHaveBeenCalledTimes(recycled ? 0 : 1);
    },
  );

  it('detaches and transfers the same existing Buff instance during an allowed skill transition', () => {
    const finish = vi.fn(() => true);
    const handle = { isRecycled: false, reference: createTestBuffReference(), finish };
    const target = {
      ownerId: 'operator',
      findFirstHandleByIds: () => handle,
      getCountByIds: () => 1,
      finishByIds: () => 0,
      holdByIds: () => ({ release: () => undefined }),
      getCountByTags: () => 0,
      matchesEntityTags: () => false,
      findFirstByIds: () => undefined,
      findFirstByTags: () => undefined,
      finishByTags: () => 0,
    };
    const executor = new BuffOperationExecutor({
      sourceId: 'operator',
      resolveTarget: () => target,
      delegate,
    });
    const step = {
      kind: 'inheritBuffById' as const,
      parameters: {
        target: 'caster' as const,
        buffId: 'music-vfx',
        inheritToNextSkillIds: ['native.followup'],
        finishByAction: true,
        finishWithNextSkillIfNotInherited: true,
      },
    };
    const detachBuffFromCurrentSkill = vi.fn();
    const attachBuffToNextSkill = vi.fn();
    const actionBuffReferencesState = { active: false, references: [] };

    executor.execute(step, {
      blackboard: new ActionBlackboard(),
      actionBuffReferencesState,
      detachBuffFromCurrentSkill,
    });
    executor.end(step, {
      blackboard: new ActionBlackboard(),
      actionBuffReferencesState,
      pendingNextSkillId: 'native.followup',
      attachBuffToNextSkill,
    });

    expect(detachBuffFromCurrentSkill).toHaveBeenCalledExactlyOnceWith(handle);
    expect(attachBuffToNextSkill).toHaveBeenCalledExactlyOnceWith(handle);
    expect(finish).not.toHaveBeenCalled();
  });

  it('ends an inherited existing Buff when no next skill is available', () => {
    const finish = vi.fn(() => true);
    const handle = { isRecycled: false, reference: createTestBuffReference(), finish };
    const target = {
      ownerId: 'operator',
      findFirstHandleByIds: () => handle,
      getCountByIds: () => 1,
      finishByIds: () => 0,
      holdByIds: () => ({ release: () => undefined }),
      getCountByTags: () => 0,
      matchesEntityTags: () => false,
      findFirstByIds: () => undefined,
      findFirstByTags: () => undefined,
      finishByTags: () => 0,
    };
    const executor = new BuffOperationExecutor({
      sourceId: 'operator',
      resolveTarget: () => target,
      delegate,
    });
    const step = {
      kind: 'inheritBuffById' as const,
      parameters: {
        target: 'caster' as const,
        buffId: 'music-vfx',
        inheritToNextSkillIds: ['native.followup'],
        finishByAction: true,
        finishWithNextSkillIfNotInherited: true,
      },
    };
    const actionBuffReferencesState = { active: false, references: [] };

    executor.execute(step, {
      blackboard: new ActionBlackboard(),
      actionBuffReferencesState,
      detachBuffFromCurrentSkill: () => undefined,
    });
    executor.end(step, { blackboard: new ActionBlackboard(), actionBuffReferencesState });

    expect(finish).toHaveBeenCalledExactlyOnceWith('other');
  });

  it.each([
    'buff',
    'ability',
    'skillActionChild',
    'castSkill',
    'physicalCastSkill',
    'rejectedCastSkill',
    'missingCastSkill',
  ] as const)('attaches scoped Buff handles to the current %s owner', owner => {
    const child = {
      isRecycled: false,
      reference: createTestBuffReference(),
      finish: vi.fn(() => true),
    };
    const addCurrentBuffChild = vi.fn();
    const usesAttachingSkillLifetime = [
      'castSkill',
      'physicalCastSkill',
      'rejectedCastSkill',
      'missingCastSkill',
    ].includes(owner);
    const target = {
      ownerId: 'operator',
      applyScoped: () => (owner === 'rejectedCastSkill' ? null : child),
      getCountByIds: () => 0,
      finishByIds: () => 0,
      holdByIds: () => ({ release: () => undefined }),
      getCountByTags: () => 0,
      matchesEntityTags: () => false,
      findFirstByIds: () => undefined,
      findFirstByTags: () => undefined,
      finishByTags: () => 0,
    };
    const executor = new BuffOperationExecutor({
      sourceId: 'operator',
      resolveTarget: () => target,
      delegate,
    });

    const execute = () =>
      executor.execute(
        {
          kind: 'applyBuff',
          parameters: {
            buffId: 'child',
            target: 'caster',
            ...(usesAttachingSkillLifetime
              ? { lifetimeOwner: 'currentCastSkill' as const }
              : { asChildBuff: true }),
          },
        },
        {
          blackboard: new ActionBlackboard(),
          ...(owner === 'skillActionChild'
            ? { attachBuffToCurrentSkill: addCurrentBuffChild }
            : owner === 'castSkill'
              ? {
                  event: {
                    event: 'beforeCastSkill' as const,
                    payload: {
                      sourceId: 'operator',
                      targetId: 'operator',
                      skillId: 'current',
                      skillType: 'battleSkill' as const,
                      skillCastId: 7,
                      attachBuffToCurrentSkill: addCurrentBuffChild,
                    },
                  },
                }
              : owner === 'physicalCastSkill'
                ? {
                    event: {
                      event: 'beforeOutputPhysicalInfliction' as const,
                      payload: {
                        sourceId: 'operator',
                        targetId: 'enemy',
                        type: 'airborne' as const,
                        attachBuffToCurrentSkill: addCurrentBuffChild,
                      },
                    },
                  }
                : owner === 'buff'
                  ? { addCurrentBuffChild }
                  : { addAbilityChildBuff: addCurrentBuffChild }),
        },
      );
    if (owner === 'missingCastSkill') {
      expect(execute).toThrow(
        'currentCastSkill Buff lifetime requires a native CastSkillContext attachment port',
      );
    } else {
      expect(execute()).toBe(true);
    }
    if (owner === 'rejectedCastSkill' || owner === 'missingCastSkill') {
      expect(addCurrentBuffChild).not.toHaveBeenCalled();
    } else {
      expect(addCurrentBuffChild).toHaveBeenCalledWith(child);
    }
    expect(child.finish).not.toHaveBeenCalled();
  });

  it.each(['actionSource', 'actionOwner'] as const)(
    '当前实例结束来源独立于触发事件：%s',
    finishSource => {
      const blackboard = new ActionBlackboard();
      const reasons: string[] = [];
      const executor = new BuffOperationExecutor({
        sourceId: 'operator',
        resolveTarget: () => {
          throw new Error('finishCurrentBuff must not resolve an entity Buff container');
        },
        delegate,
      });

      expect(
        executor.execute(
          { kind: 'finishCurrentBuff', parameters: { reason: 'early', finishSource } },
          {
            blackboard,
            buffSourceId: 'operator',
            actionSourceId: 'action-source',
            buffOwnerId: 'buff-owner',
            eventSkillCastInfo: {
              skillCastId: 99,
              originSkillId: 'event',
              originSkillType: 'comboSkill',
              nonReturnedSpCost: 10,
            },
            finishCurrentBuff: (reason, sourceId, cast) => {
              expect(sourceId).toBe(
                finishSource === 'actionSource' ? 'action-source' : 'buff-owner',
              );
              expect(cast).toBeNull();
              reasons.push(reason);
              return true;
            },
          },
        ),
      ).toBe(true);
      expect(reasons).toEqual(['early']);
    },
  );

  it('finishes Buffs on the current ability entity without aliasing it to the caster', () => {
    const finished: string[][] = [];
    const entityTarget = {
      ownerId: 'abilityEntity:7',
      getCountByIds: () => 0,
      finishByIds: (ids: readonly string[]) => {
        finished.push([...ids]);
        return ids.length;
      },
      holdByIds: () => ({ release: () => undefined }),
      getCountByTags: () => 0,
      matchesEntityTags: () => false,
      findFirstByIds: () => undefined,
      findFirstByTags: () => undefined,
      finishByTags: () => 0,
    };
    const executor = new BuffOperationExecutor({
      sourceId: 'operator',
      resolveTarget: () => {
        throw new Error('current ability entity must not resolve through CombatTarget');
      },
      resolveCurrentAbilityEntityTarget: () => entityTarget,
      delegate,
    });

    expect(
      executor.execute(
        {
          kind: 'finishBuffsById',
          parameters: {
            target: 'currentAbilityEntity',
            buffIds: ['effect', 'effect-line'],
            reason: 'other',
          },
        },
        {
          blackboard: new ActionBlackboard(),
          currentTarget: { kind: 'abilityEntity', instanceId: 7 },
        },
      ),
    ).toBe(true);
    expect(finished).toEqual([['effect', 'effect-line']]);
  });

  it('resolves a partial Buff finish count from the current action blackboard', () => {
    const calls: { ids: readonly string[]; count: number; reason: string }[] = [];
    const executor = new BuffOperationExecutor({
      sourceId: 'operator',
      resolveTarget: () => ({
        ownerId: 'operator',
        getCountByIds: () => 0,
        findFirstByIds: () => undefined,
        finishByIds: () => 0,
        finishCountByIds: (ids, count, reason) => {
          calls.push({ ids, count, reason });
          return count;
        },
        holdByIds: () => ({ release: () => undefined }),
        getCountByTags: () => 0,
        matchesEntityTags: () => false,
        findFirstByTags: () => undefined,
        finishByTags: () => 0,
      }),
      delegate,
    });
    const blackboard = new ActionBlackboard({ layers: 1 });

    expect(
      executor.execute(
        {
          kind: 'finishBuffsById',
          parameters: {
            target: 'caster',
            buffIds: ['preparation'],
            reason: 'other',
            count: { kind: 'blackboard', key: 'layers' },
          },
        },
        { blackboard },
      ),
    ).toBe(true);
    expect(calls).toEqual([{ ids: ['preparation'], count: 1, reason: 'other' }]);
  });

  it('resolves a partial tag Buff finish count from the current action blackboard', () => {
    const calls: { tags: readonly GameplayTag[]; count: number; reason: string }[] = [];
    const executor = new BuffOperationExecutor({
      sourceId: 'operator',
      resolveTarget: () => ({
        ownerId: 'enemy',
        getCountByIds: () => 0,
        findFirstByIds: () => undefined,
        finishByIds: () => 0,
        holdByIds: () => ({ release: () => undefined }),
        getCountByTags: () => 0,
        matchesEntityTags: () => false,
        findFirstByTags: () => undefined,
        finishByTags: () => 0,
        finishCountByTags: (tags, _type, count, reason) => {
          calls.push({ tags, count, reason });
          return count;
        },
      }),
      delegate,
    });
    const tag = 'buff/status/fire';

    expect(
      executor.execute(
        {
          kind: 'finishBuffsByTag',
          parameters: {
            target: 'enemy',
            tagQueryType: 'hasAny',
            buffTags: [tag],
            reason: 'early',
            count: { kind: 'constant', value: 1 },
          },
        },
        { blackboard: new ActionBlackboard() },
      ),
    ).toBe(true);
    expect(calls).toEqual([{ tags: [tag], count: 1, reason: 'early' }]);
  });

  it('writes a matching Buff stack count to the action blackboard', () => {
    const blackboard = new ActionBlackboard();
    const executor = new BuffOperationExecutor({
      sourceId: 'operator',
      resolveTarget: () => ({
        ownerId: 'enemy',
        getCountByIds: () => 3,
        finishByIds: () => 0,
        holdByIds: () => ({ release: () => undefined }),
        getCountByTags: () => 2,
        matchesEntityTags: () => false,
        findFirstByIds: () => undefined,
        findFirstByTags: () => undefined,
        finishByTags: () => 0,
      }),
      delegate,
    });

    expect(
      executor.execute(
        {
          kind: 'readBuffStackCount',
          parameters: {
            target: 'enemy',
            outputKey: 'inflictCnt',
            query: {
              kind: 'tag',
              tagQueryType: 'hasAny',
              buffTags: ['buff/status/conduct'],
            },
          },
        },
        { blackboard },
      ),
    ).toBe(true);
    expect(blackboard.getNumber('inflictCnt')).toBe(2);
  });

  it('writes the executing Buff enhance count for an environment query', () => {
    const blackboard = new ActionBlackboard({ count: 0 });
    const executor = new BuffOperationExecutor({
      sourceId: 'operator',
      resolveTarget: () => {
        throw new Error('environment query must not resolve a target container');
      },
      delegate,
    });

    expect(
      executor.execute(
        {
          kind: 'readBuffStackCount',
          parameters: {
            target: 'caster',
            outputKey: 'count',
            query: { kind: 'environment' },
          },
        },
        { blackboard, getCurrentBuffEnhanceCount: () => 4 },
      ),
    ).toBe(true);
    expect(blackboard.getNumber('count')).toBe(4);
  });

  it('writes the executing finite Buff remaining duration and maps infinity to zero', () => {
    const blackboard = new ActionBlackboard();
    const executor = new BuffOperationExecutor({
      sourceId: 'operator',
      resolveTarget: () => {
        throw new Error('current Buff lifetime must not resolve a target container');
      },
      delegate,
    });
    const step = {
      kind: 'readCurrentBuffRemainingDuration' as const,
      parameters: { outputKey: 'duration_dynamic' },
    };

    expect(
      executor.execute(step, {
        blackboard,
        getCurrentBuffRemainingDuration: () => 7.5,
      }),
    ).toBe(true);
    expect(blackboard.getNumber('duration_dynamic')).toBe(7.5);

    executor.execute(step, {
      blackboard,
      getCurrentBuffRemainingDuration: () => null,
    });
    expect(blackboard.getNumber('duration_dynamic')).toBe(0);
  });

  it('assigns, adds, and multiplies the executing finite Buff remaining duration', () => {
    const blackboard = new ActionBlackboard({ duration_dynamic: 6 });
    let remaining: number | null = 10;
    const executor = new BuffOperationExecutor({
      sourceId: 'operator',
      resolveTarget: () => {
        throw new Error('current Buff duration mutation must not resolve a target container');
      },
      delegate,
    });
    const execute = (operation: 'assign' | 'add' | 'multiply', value: number) =>
      executor.execute(
        {
          kind: 'setCurrentBuffRemainingDuration',
          parameters: { operation, value: { kind: 'constant', value } },
        },
        {
          blackboard,
          getCurrentBuffRemainingDuration: () => remaining,
          setCurrentBuffRemainingDuration: value => {
            remaining = value;
          },
        },
      );

    expect(execute('assign', 6)).toBe(true);
    expect(remaining).toBe(6);
    execute('add', 2);
    expect(remaining).toBe(8);
    execute('multiply', 0.5);
    expect(remaining).toBe(4);
    execute('assign', -1);
    expect(remaining).toBe(0);
  });

  it.each(['tag', 'id'] as const)(
    'writes %s Buff instance count only for the explicit DSL instance mode (not native BuffCount)',
    queryKind => {
      const blackboard = new ActionBlackboard();
      const executor = new BuffOperationExecutor({
        sourceId: 'operator',
        resolveTarget: () => ({
          ownerId: 'enemy',
          getCountByIds: () => 0,
          finishByIds: () => 0,
          holdByIds: () => ({ release: () => undefined }),
          getCountByTags: () => 4,
          getInstanceCountByTags: () => 2,
          getInstanceCountByIds: () => 2,
          matchesEntityTags: () => false,
          findFirstByIds: () => undefined,
          findFirstByTags: () => undefined,
          finishByTags: () => 0,
        }),
        delegate,
      });

      expect(
        executor.execute(
          {
            kind: 'readBuffStackCount',
            parameters: {
              target: 'enemy',
              outputKey: 'buffCnt',
              countType: 'instance',
              query:
                queryKind === 'id'
                  ? { kind: 'id', buffIds: ['buff:sample'] }
                  : {
                      kind: 'tag',
                      tagQueryType: 'hasAny',
                      buffTags: ['buff/status/fracture'],
                    },
            },
          },
          { blackboard },
        ),
      ).toBe(true);
      expect(blackboard.getNumber('buffCnt')).toBe(2);
    },
  );

  it('resolves action-blackboard assignments before applying a index buff', () => {
    const applied: unknown[] = [];
    const target = {
      ownerId: 'caster',
      apply: (request: unknown) => {
        applied.push(request);
        return true;
      },
      getCountByIds: () => 0,
      finishByIds: () => 0,
      holdByIds: () => ({ release: () => undefined }),
      getCountByTags: () => 0,
      matchesEntityTags: () => false,
      findFirstByIds: () => undefined,
      findFirstByTags: () => undefined,
      finishByTags: () => 0,
    };
    const executor = new BuffOperationExecutor({
      sourceId: 'operator',
      resolveTarget: () => target,
      delegate,
    });
    const blackboard = new ActionBlackboard({ rate: 4 });

    expect(
      executor.execute(
        {
          kind: 'applyBuff',
          parameters: {
            buffId: 'ultimate-base',
            target: 'caster',
            blackboardAssignments: {
              duration: { kind: 'constant', value: 25 },
              comboRate: { kind: 'blackboard', key: 'rate' },
            },
            stringBlackboardAssignments: {
              child_buff_id: 'buff:icon',
            },
          },
        },
        { blackboard },
      ),
    ).toBe(true);
    expect(applied).toEqual([
      {
        buffId: 'ultimate-base',
        definitionOwnerId: 'operator',
        sourceId: 'operator',
        blackboardValues: { duration: 25, comboRate: 4, child_buff_id: 'buff:icon' },
      },
    ]);

    expect(
      executor.execute(
        {
          kind: 'applyBuff',
          parameters: {
            buffId: 'external-event-buff',
            target: 'caster',
            inheritSourceSkillCastInfo: true,
          },
        },
        { blackboard: new ActionBlackboard() },
      ),
    ).toBe(true);
    expect(applied[1]).toEqual({
      buffId: 'external-event-buff',
      definitionOwnerId: 'operator',
      sourceId: 'operator',
      blackboardValues: {},
    });
  });

  it('resolves an id-only application from the operator Buff blueprint table', () => {
    const applied: unknown[] = [];
    const definition = {
      stackingType: 'refresh' as const,
      priority: 0,
      maxStackCount: 1,
    };
    const target = {
      ownerId: 'caster',
      apply: (request: unknown) => {
        applied.push(request);
        return true;
      },
      getCountByIds: () => 0,
      finishByIds: () => 0,
      holdByIds: () => ({ release: () => undefined }),
      getCountByTags: () => 0,
      matchesEntityTags: () => false,
      findFirstByIds: () => undefined,
      findFirstByTags: () => undefined,
      finishByTags: () => 0,
    };
    const executor = new BuffOperationExecutor({
      sourceId: 'operator',
      resolveTarget: () => target,
      resolveBuffDefinition: buffId => (buffId === 'operator-mark' ? definition : undefined),
      delegate,
    });

    expect(
      executor.execute({
        kind: 'applyBuff',
        parameters: { buffId: 'operator-mark', target: 'caster' },
      }),
    ).toBe(true);
    expect(applied).toEqual([
      {
        buffId: 'operator-mark',
        definition,
        definitionOwnerId: 'operator',
        sourceId: 'operator',
        blackboardValues: {},
      },
    ]);
  });

  it('applies a party Buff to every resolved operator target', () => {
    const appliedTo: string[] = [];
    const createTarget = (ownerId: string) => ({
      ownerId,
      apply: () => {
        appliedTo.push(ownerId);
        return true;
      },
      getCountByIds: () => 0,
      finishByIds: () => 0,
      holdByIds: () => ({ release: () => undefined }),
      getCountByTags: () => 0,
      matchesEntityTags: () => false,
      findFirstByIds: () => undefined,
      findFirstByTags: () => undefined,
      finishByTags: () => 0,
    });
    const party = [createTarget('operator-a'), createTarget('operator-b')];
    const executor = new BuffOperationExecutor({
      sourceId: 'operator-a',
      resolveTarget: () => party[0]!,
      resolveApplicationTargets: target => (target === 'party' ? party : [party[0]!]),
      delegate,
    });

    expect(
      executor.execute({
        kind: 'applyBuff',
        parameters: { buffId: 'party-buff', target: 'party' },
      }),
    ).toBe(true);
    expect(appliedTo).toEqual(['operator-a', 'operator-b']);
  });

  it('把主控干员作为施加目标交给集合目标解析器', () => {
    const appliedTo: string[] = [];
    const controlledTarget = {
      ownerId: 'operator-controlled',
      apply: () => {
        appliedTo.push('operator-controlled');
        return true;
      },
      getCountByIds: () => 0,
      finishByIds: () => 0,
      holdByIds: () => ({ release: () => undefined }),
      getCountByTags: () => 0,
      matchesEntityTags: () => false,
      findFirstByIds: () => undefined,
      findFirstByTags: () => undefined,
      finishByTags: () => 0,
    };
    const executor = new BuffOperationExecutor({
      sourceId: 'operator-source',
      resolveTarget: () => controlledTarget,
      resolveApplicationTargets: target => {
        expect(target).toBe('controlledOperator');
        return [controlledTarget];
      },
      delegate,
    });

    expect(
      executor.execute({
        kind: 'applyBuff',
        parameters: { buffId: 'controlled-buff', target: 'controlledOperator' },
      }),
    ).toBe(true);
    expect(appliedTo).toEqual(['operator-controlled']);
  });

  it('resolves a lifecycle child Buff and query against the current Buff owner', () => {
    const applied: unknown[] = [];
    const owner = {
      ownerId: 'operator-b',
      apply: (request: unknown) => {
        applied.push(request);
        return true;
      },
      getCountByIds: () => 3,
      finishByIds: () => 0,
      holdByIds: () => ({ release: () => undefined }),
      getCountByTags: () => 0,
      matchesEntityTags: () => false,
      findFirstByIds: () => undefined,
      findFirstByTags: () => undefined,
      finishByTags: () => 0,
    };
    const executor = new BuffOperationExecutor({
      sourceId: 'operator-a',
      resolveTarget: () => owner,
      resolveEventTarget: targetId => {
        expect(targetId).toBe('operator-b');
        return owner;
      },
      delegate,
    });
    const context = {
      blackboard: new ActionBlackboard({ count: 0 }),
      buffOwnerId: 'operator-b',
    };

    expect(
      executor.execute(
        {
          kind: 'applyBuff',
          parameters: { buffId: 'owner-child', target: 'buffOwner' },
        },
        context,
      ),
    ).toBe(true);
    expect(
      executor.execute(
        {
          kind: 'readBuffStackCount',
          parameters: {
            target: 'buffOwner',
            outputKey: 'count',
            query: { kind: 'id', buffIds: ['owner-child'] },
          },
        },
        context,
      ),
    ).toBe(true);
    expect(applied).toEqual([
      expect.objectContaining({ buffId: 'owner-child', sourceId: 'operator-a' }),
    ]);
    expect(context.blackboard.getNumber('count')).toBe(3);
  });

  it('resolves an operator-healed semantic event target for Buff application', () => {
    const applied: unknown[] = [];
    const target = {
      ownerId: 'operator-b',
      apply: (request: unknown) => {
        applied.push(request);
        return true;
      },
      getCountByIds: () => 0,
      finishByIds: () => 0,
      holdByIds: () => ({ release: () => undefined }),
      getCountByTags: () => 0,
      matchesEntityTags: () => false,
      findFirstByIds: () => undefined,
      findFirstByTags: () => undefined,
      finishByTags: () => 0,
    };
    const executor = new BuffOperationExecutor({
      sourceId: 'operator-a',
      resolveTarget: () => target,
      resolveEventTarget: targetId => {
        expect(targetId).toBe('operator-b');
        return target;
      },
      delegate,
    });

    expect(
      executor.execute(
        {
          kind: 'applyBuff',
          parameters: { buffId: 'healing-trigger-buff', target: 'eventTarget' },
        },
        {
          blackboard: new ActionBlackboard(),
          event: {
            event: 'receiveHeal' as const,
            payload: {
              sourceId: 'operator-a',
              targetId: 'operator-b',
              requestedHealing: 100,
              actualHealing: 0,
              overhealing: 100,
              tags: ['Test/Tag1'],
            },
          },
        },
      ),
    ).toBe(true);
    expect(applied).toEqual([
      expect.objectContaining({ buffId: 'healing-trigger-buff', sourceId: 'operator-a' }),
    ]);
  });

  it.each([false, true])(
    'uses the explicit ActionSource without an event and prioritizes a live event (%s)',
    liveEvent => {
      const applied: unknown[] = [];
      const source = {
        ownerId: 'operator-b',
        apply: (request: unknown) => {
          applied.push(request);
          return true;
        },
        getCountByIds: () => 0,
        finishByIds: () => 0,
        holdByIds: () => ({ release: () => undefined }),
        getCountByTags: () => 0,
        matchesEntityTags: () => false,
        findFirstByIds: () => undefined,
        findFirstByTags: () => undefined,
        finishByTags: () => 0,
      };
      const executor = new BuffOperationExecutor({
        sourceId: 'operator-a',
        resolveTarget: () => source,
        resolveEventTarget: id => {
          expect(id).toBe('operator-b');
          return source;
        },
        delegate,
      });

      expect(
        executor.execute(
          {
            kind: 'applyBuff',
            parameters: {
              buffId: 'event-source-buff',
              target: 'eventSource',
              source: 'eventSource',
            },
          },
          {
            blackboard: new ActionBlackboard(),
            actionSourceId: liveEvent ? 'must-not-override-event' : 'operator-b',
            ...(liveEvent
              ? {
                  event: {
                    event: 'beforeCastSkill' as const,
                    payload: {
                      sourceId: 'operator-b',
                      targetId: 'operator-b',
                      skillType: 'battleSkill' as const,
                      skillId: 'skill',
                      skillCastId: 7,
                    },
                  },
                }
              : {}),
          },
        ),
      ).toBe(true);
      expect(applied).toEqual([
        expect.objectContaining({ buffId: 'event-source-buff', sourceId: 'operator-b' }),
      ]);
    },
  );

  it('uses the current Buff source for ActionSource during lifecycle sequences without an event', () => {
    const applied: unknown[] = [];
    const owner = {
      ownerId: 'operator-owner',
      apply: (request: unknown) => {
        applied.push(request);
        return true;
      },
      getCountByIds: () => 0,
      finishByIds: () => 0,
      holdByIds: () => ({ release: () => undefined }),
      getCountByTags: () => 0,
      matchesEntityTags: () => false,
      findFirstByIds: () => undefined,
      findFirstByTags: () => undefined,
      finishByTags: () => 0,
    };
    const source = { ...owner, ownerId: 'operator-source' };
    const executor = new BuffOperationExecutor({
      sourceId: 'operator-owner',
      resolveTarget: () => owner,
      resolveEventTarget: id => (id === source.ownerId ? source : owner),
      delegate,
    });

    expect(
      executor.execute(
        {
          kind: 'applyBuff',
          parameters: {
            buffId: 'lifecycle-child',
            target: 'buffOwner',
            source: 'eventSource',
          },
        },
        {
          blackboard: new ActionBlackboard(),
          buffOwnerId: owner.ownerId,
          buffSourceId: source.ownerId,
        },
      ),
    ).toBe(true);
    expect(applied).toEqual([
      expect.objectContaining({ buffId: 'lifecycle-child', sourceId: source.ownerId }),
    ]);
  });

  it('reads a numeric value from the consumed Buff instance', () => {
    const target = {
      ownerId: 'operator',
      getCountByIds: () => 0,
      finishByIds: () => 0,
      holdByIds: () => ({ release: () => undefined }),
      getCountByTags: () => 0,
      matchesEntityTags: () => false,
      findFirstByIds: () => undefined,
      findFirstByTags: () => undefined,
      finishByTags: () => 0,
    };
    const executor = new BuffOperationExecutor({
      sourceId: 'operator',
      resolveTarget: () => target,
      delegate,
    });
    const blackboard = new ActionBlackboard({ addstack: 1 });

    expect(
      executor.execute(
        {
          kind: 'readEventBuffBlackboard',
          parameters: { desiredKey: 'count', outputKey: 'addstack' },
        },
        {
          blackboard,
          actionInputTarget: { kind: 'enemy' },
          event: {
            event: 'buffConsumed' as const,
            payload: {
              buff: createEventBuff({ count: 3 }),
              sourceId: 'operator',
              targetId: 'enemy',
              buffId: 'buff:conduct',
              layers: 3,
              buffTags: ['Skill/Character/Common/SpellStatus/Conduct'],
              blackboardValues: { count: 3 },
            },
          },
        },
      ),
    ).toBe(true);
    expect(blackboard.getNumber('addstack')).toBe(3);
  });

  it('uses an explicitly selected entity as the Buff source', () => {
    const applied: unknown[] = [];
    const targets = {
      caster: {
        ownerId: 'operator',
        getCountByIds: () => 0,
        finishByIds: () => 0,
        holdByIds: () => ({ release: () => undefined }),
        getCountByTags: () => 0,
        matchesEntityTags: () => false,
        findFirstByIds: () => undefined,
        findFirstByTags: () => undefined,
        finishByTags: () => 0,
      },
      enemy: {
        ownerId: 'enemy-1',
        apply: (request: unknown) => {
          applied.push(request);
          return true;
        },
        getCountByIds: () => 0,
        finishByIds: () => 0,
        holdByIds: () => ({ release: () => undefined }),
        getCountByTags: () => 0,
        matchesEntityTags: () => false,
        findFirstByIds: () => undefined,
        findFirstByTags: () => undefined,
        finishByTags: () => 0,
      },
    };
    const executor = new BuffOperationExecutor({
      sourceId: 'operator',
      resolveTarget: target => targets[target],
      delegate,
    });

    expect(
      executor.execute({
        kind: 'applyBuff',
        parameters: {
          buffId: 'mark',
          target: 'enemy',
          source: 'enemy',
        },
      }),
    ).toBe(true);
    expect(applied).toEqual([
      {
        buffId: 'mark',
        definitionOwnerId: 'operator',
        sourceId: 'enemy-1',
        blackboardValues: {},
      },
    ]);
  });

  it('uses the current ability entity handle as the Buff source', () => {
    const applied: unknown[] = [];
    const target = {
      ownerId: 'enemy-1',
      apply: (request: unknown) => {
        applied.push(request);
        return true;
      },
      getCountByIds: () => 0,
      finishByIds: () => 0,
      holdByIds: () => ({ release: () => undefined }),
      getCountByTags: () => 0,
      matchesEntityTags: () => false,
      findFirstByIds: () => undefined,
      findFirstByTags: () => undefined,
      finishByTags: () => 0,
    };
    const executor = new BuffOperationExecutor({
      sourceId: 'operator',
      resolveTarget: () => target,
      resolveCurrentAbilityEntityTarget: () => ({ ...target, ownerId: 'abilityEntity:7' }),
      delegate,
    });

    expect(
      executor.execute(
        {
          kind: 'applyBuff',
          parameters: {
            buffId: 'entity-sourced-mark',
            target: 'enemy',
            source: 'currentAbilityEntity',
          },
        },
        {
          blackboard: new ActionBlackboard(),
          currentTarget: { kind: 'abilityEntity', instanceId: 7 },
        },
      ),
    ).toBe(true);
    expect(applied).toEqual([expect.objectContaining({ sourceId: 'abilityEntity:7' })]);
  });

  it('repeats a Buff using the runtime action-blackboard count', () => {
    const applied: unknown[] = [];
    const target = {
      ownerId: 'enemy-1',
      apply: (request: unknown) => {
        applied.push(request);
        return true;
      },
      getCountByIds: () => 0,
      finishByIds: () => 0,
      holdByIds: () => ({ release: () => undefined }),
      getCountByTags: () => 0,
      matchesEntityTags: () => false,
      findFirstByIds: () => undefined,
      findFirstByTags: () => undefined,
      finishByTags: () => 0,
    };
    const executor = new BuffOperationExecutor({
      sourceId: 'operator',
      resolveTarget: () => target,
      delegate,
    });
    const blackboard = new ActionBlackboard({ count: 2.5 });

    expect(
      executor.execute(
        {
          kind: 'applyBuff',
          parameters: {
            buffId: 'stack-marker',
            target: 'enemy',
            count: { kind: 'blackboard', key: 'count' },
          },
        },
        { blackboard },
      ),
    ).toBe(true);
    expect(applied).toHaveLength(3);
  });

  it('forwards the current skill-cast snapshot only when the action requests it', () => {
    const applied: unknown[] = [];
    const target = {
      ownerId: 'caster',
      apply: (request: unknown) => {
        applied.push(request);
        return true;
      },
      getCountByIds: () => 0,
      finishByIds: () => 0,
      holdByIds: () => ({ release: () => undefined }),
      getCountByTags: () => 0,
      matchesEntityTags: () => false,
      findFirstByIds: () => undefined,
      findFirstByTags: () => undefined,
      finishByTags: () => 0,
    };
    const executor = new BuffOperationExecutor({
      sourceId: 'operator',
      resolveTarget: () => target,
      delegate,
    });
    const skillCastInfo = {
      skillCastId: 7,
      originSkillId: 'ultimate',
      originSkillType: 'ultimate' as const,
      nonReturnedSpCost: 90,
    };

    expect(
      executor.execute(
        {
          kind: 'applyBuff',
          parameters: {
            buffId: 'ultimate-base',
            target: 'caster',
            inheritSourceSkillCastInfo: true,
          },
        },
        { blackboard: new ActionBlackboard(), skillCastInfo },
      ),
    ).toBe(true);
    expect(applied).toEqual([
      {
        buffId: 'ultimate-base',
        definitionOwnerId: 'operator',
        sourceId: 'operator',
        blackboardValues: {},
        skillCastInfo,
      },
    ]);
  });

  it('keeps legacy applyBuff timing fields on the existing delegate path', () => {
    const calls: string[] = [];
    const executor = new BuffOperationExecutor({
      sourceId: 'operator',
      resolveTarget: () => ({
        ownerId: 'enemy',
        apply: () => {
          calls.push('index');
          return true;
        },
        getCountByIds: () => 0,
        finishByIds: () => 0,
        holdByIds: () => ({ release: () => undefined }),
        getCountByTags: () => 0,
        matchesEntityTags: () => false,
        findFirstByIds: () => undefined,
        findFirstByTags: () => undefined,
        finishByTags: () => 0,
      }),
      delegate: {
        execute: () => {
          calls.push('delegate');
          return true;
        },
        evaluate: () => false,
      },
    });

    expect(
      executor.execute({
        kind: 'applyBuff',
        parameters: {
          buffId: 'legacy',
          target: 'enemy',
          durationSeconds: 10,
          effectiveness: 1,
        },
      }),
    ).toBe(true);
    expect(calls).toEqual(['delegate']);
  });

  it('compares matching buff enhance stacks with the native tolerance', () => {
    const path = 'buff/status/conduct';
    const target = new CombatBuffContainer(
      'enemy',
      new CombatAttributeSet(),
      new GameplayTagRegistry([path]),
    );
    const definition = {
      id: 'conduct',
      stackingType: 'enhance' as const,
      maxStackCount: 4,
      applyTags: [path],
    };
    target.add(definition, 'operator');
    target.add(definition, 'operator');
    const executor = new BuffOperationExecutor({
      sourceId: 'operator',
      resolveTarget: () => target,
      resolveEventTarget: id => {
        expect(id).toBe('enemy');
        return target;
      },
      delegate,
    });
    const condition = {
      kind: 'buffStackCompare' as const,
      target: 'buffOwner' as const,
      tagQueryType: 'hasAny' as const,
      buffTags: [path],
      operator: 'greaterOrEqual' as const,
      value: { kind: 'constant' as const, value: 2.000009 },
    };
    const context = {
      blackboard: new ActionBlackboard({ threshold: 2.000011 }),
      buffOwnerId: 'enemy',
    };

    expect(executor.evaluate(condition, context)).toBe(true);
    expect(
      executor.evaluate({ ...condition, value: { kind: 'blackboard', key: 'threshold' } }, context),
    ).toBe(false);
  });

  it('counts distinct matching Buff definition IDs instead of instances or enhance stacks', () => {
    const path = 'buff/status/corrosion';
    const target = new CombatBuffContainer(
      'enemy',
      new CombatAttributeSet(),
      new GameplayTagRegistry([path]),
    );
    const enhanced = {
      id: 'corrosion-a',
      stackingType: 'enhance' as const,
      maxStackCount: 4,
      applyTags: [path],
    };
    const duplicate = {
      id: 'corrosion-b',
      stackingType: 'unlimited' as const,
      applyTags: [path],
    };
    target.add(enhanced, 'operator');
    target.add(enhanced, 'operator');
    target.add(duplicate, 'operator');
    target.add(duplicate, 'operator');
    const executor = new BuffOperationExecutor({
      sourceId: 'operator',
      resolveTarget: () => target,
      resolveEventTarget: () => target,
      delegate,
    });
    const context = {
      blackboard: new ActionBlackboard(),
      buffOwnerId: 'enemy',
    };

    expect(target.getCountByTags([path])).toBe(4);
    expect(target.getInstanceCountByTags([path])).toBe(3);
    expect(
      executor.evaluate(
        {
          kind: 'buffTagIdCountCompare',
          target: 'buffOwner',
          tagQueryType: 'hasAny',
          buffTags: [path],
          operator: 'equal',
          value: { kind: 'constant', value: 2 },
        },
        context,
      ),
    ).toBe(true);
  });

  it('queries entity tags, including applyTags registered by enabled Buffs', () => {
    const parentPath = 'combat/state/special';
    const childPath = 'combat/state/special/enhanced';
    const classificationPath = 'buff/classification/enhancement';
    const target = new CombatBuffContainer(
      'operator',
      new CombatAttributeSet(),
      new GameplayTagRegistry([parentPath, childPath, classificationPath]),
    );
    target.add(
      {
        id: 'enhanced-state',
        stackingType: 'unlimited',
        applyTags: [classificationPath],
      },
      'operator',
    );
    target.addEntityTags([childPath]);
    const executor = new BuffOperationExecutor({
      sourceId: 'operator',
      resolveTarget: () => target,
      delegate,
    });
    const condition = {
      kind: 'entityTagMatch' as const,
      target: 'caster' as const,
      tagQueryType: 'hasAny' as const,
      tags: [parentPath],
    };

    expect(executor.evaluate(condition)).toBe(true);
    expect(
      executor.evaluate({
        ...condition,
        tags: [classificationPath],
      }),
    ).toBe(true);
    target.removeEntityTags([childPath]);
    expect(executor.evaluate(condition)).toBe(false);
  });

  it('reads the first matching active buff and writes its value to the action blackboard', () => {
    const path = 'buff/status/conduct';
    const target = new CombatBuffContainer(
      'enemy',
      new CombatAttributeSet(),
      new GameplayTagRegistry([path]),
    );
    target.add(
      {
        id: 'first',
        stackingType: 'unlimited',
        applyTags: [path],
        blackboard: { count: 4 },
      },
      'operator',
    );
    target.add(
      {
        id: 'second',
        stackingType: 'unlimited',
        applyTags: [path],
        blackboard: { count: 9 },
      },
      'operator',
    );
    const blackboard = new ActionBlackboard();
    const executor = new BuffOperationExecutor({
      sourceId: 'operator',
      resolveTarget: () => target,
      delegate,
    });

    expect(
      executor.execute(
        {
          kind: 'readBuffBlackboard',
          parameters: {
            target: 'enemy',
            query: {
              kind: 'tag',
              tagQueryType: 'hasAny',
              buffTags: [path],
            },
            desiredKey: 'count',
            outputKey: 'conductCount',
          },
        },
        { blackboard },
      ),
    ).toBe(true);
    expect(blackboard.getNumber('conductCount')).toBe(4);
  });

  it('reads the first Buff matching an ID query', () => {
    const target = new CombatBuffContainer(
      'caster',
      new CombatAttributeSet(),
      new GameplayTagRegistry([]),
    );
    target.add(
      {
        id: 'other',
        stackingType: 'unlimited',
        blackboard: { value: 3 },
      },
      'operator',
    );
    target.add(
      {
        id: 'wanted',
        stackingType: 'unlimited',
        blackboard: { value: 8 },
      },
      'operator',
    );
    const blackboard = new ActionBlackboard();
    const executor = new BuffOperationExecutor({
      sourceId: 'operator',
      resolveTarget: () => target,
      delegate,
    });

    expect(
      executor.execute(
        {
          kind: 'readBuffBlackboard',
          parameters: {
            target: 'caster',
            query: { kind: 'id', buffIds: ['wanted'] },
            desiredKey: 'value',
            outputKey: 'result',
          },
        },
        { blackboard },
      ),
    ).toBe(true);
    expect(blackboard.getNumber('result')).toBe(8);
  });

  it('writes zero for a missing key but fails when no buff matches', () => {
    const matchedPath = 'buff/status/conduct';
    const missingPath = 'buff/status/missing';
    const target = new CombatBuffContainer(
      'enemy',
      new CombatAttributeSet(),
      new GameplayTagRegistry([matchedPath, missingPath]),
    );
    target.add(
      {
        id: 'matched',
        stackingType: 'unlimited',
        applyTags: [matchedPath],
      },
      'operator',
    );
    const blackboard = new ActionBlackboard({ output: 7 });
    const executor = new BuffOperationExecutor({
      sourceId: 'operator',
      resolveTarget: () => target,
      delegate,
    });
    const createStep = (path: string) => ({
      kind: 'readBuffBlackboard' as const,
      parameters: {
        target: 'enemy' as const,
        query: {
          kind: 'tag' as const,
          tagQueryType: 'hasAny' as const,
          buffTags: [path],
        },
        desiredKey: 'count',
        outputKey: 'output',
      },
    });

    expect(executor.execute(createStep(matchedPath), { blackboard })).toBe(true);
    expect(blackboard.getNumber('output')).toBe(0);
    blackboard.assignDynamic('output', 7);
    expect(executor.execute(createStep(missingPath), { blackboard })).toBe(false);
    expect(blackboard.getNumber('output')).toBe(7);
  });

  it('finishes every matching active buff with the configured reason', () => {
    const path = 'buff/status/conduct';
    const otherPath = 'buff/status/other';
    const target = new CombatBuffContainer(
      'enemy',
      new CombatAttributeSet(),
      new GameplayTagRegistry([path, otherPath]),
    );
    const first = target.add(
      {
        id: 'first',
        stackingType: 'unlimited',
        applyTags: [path],
      },
      'operator',
    );
    const second = target.add(
      {
        id: 'second',
        stackingType: 'unlimited',
        applyTags: [path],
      },
      'operator',
    );
    const unrelated = target.add(
      {
        id: 'unrelated',
        stackingType: 'unlimited',
        applyTags: [otherPath],
      },
      'operator',
    );
    const executor = new BuffOperationExecutor({
      sourceId: 'operator',
      resolveTarget: () => target,
      delegate,
    });

    expect(
      executor.execute({
        kind: 'finishBuffsByTag',
        parameters: {
          target: 'enemy',
          tagQueryType: 'hasAny',
          buffTags: [path],
          reason: 'early',
        },
      }),
    ).toBe(true);
    expect(first?.finishReason).toBe('early');
    expect(second?.finishReason).toBe('early');
    expect(unrelated?.isFinished).toBe(false);
  });

  it('queries and finishes caster buffs by stable Buff identity', () => {
    const caster = new CombatBuffContainer('operator', new CombatAttributeSet());
    const active = caster.add(
      { id: 'sword-trigger', stackingType: 'stack', maxStackCount: 3 },
      'operator',
    );
    caster.add({ id: 'sword-trigger', stackingType: 'stack', maxStackCount: 3 }, 'operator');
    const executor = new BuffOperationExecutor({
      sourceId: 'operator',
      resolveTarget: () => caster,
      delegate,
    });

    expect(
      executor.evaluate({
        kind: 'buffIdStackCompare',
        target: 'caster',
        buffIds: ['sword-trigger'],
        operator: 'greaterOrEqual',
        value: 2,
      }),
    ).toBe(true);
    expect(
      executor.evaluate(
        {
          kind: 'buffIdStackCompare',
          target: 'caster',
          buffIds: ['sword-trigger'],
          operator: 'equal',
          value: { kind: 'blackboard', key: 'expectedStacks' },
        },
        { blackboard: new ActionBlackboard({ expectedStacks: 2 }) },
      ),
    ).toBe(true);
    expect(
      executor.execute({
        kind: 'finishBuffsById',
        parameters: {
          target: 'caster',
          buffIds: ['sword-trigger'],
          reason: 'other',
        },
      }),
    ).toBe(true);
    expect(active?.finishReason).toBe('other');
    expect(caster.getCountById('sword-trigger')).toBe(0);
  });

  it('limits Buff stack queries to the current inherited skill cast', () => {
    const caster = new CombatBuffContainer('operator', new CombatAttributeSet());
    const skillCastInfo = {
      skillCastId: 7,
      originSkillId: 'normal',
      originSkillType: 'basicAttack' as const,
      nonReturnedSpCost: 0,
    };
    caster.add({ id: 'infliction', stackingType: 'unlimited' }, 'operator', { skillCastInfo });
    caster.add({ id: 'infliction', stackingType: 'unlimited' }, 'operator', {
      skillCastInfo: { ...skillCastInfo, skillCastId: 8 },
    });
    const executor = new BuffOperationExecutor({
      sourceId: 'operator',
      resolveTarget: () => caster,
      delegate,
    });
    const context = { blackboard: new ActionBlackboard(), skillCastInfo };

    expect(
      executor.evaluate(
        {
          kind: 'buffIdStackCompare',
          target: 'caster',
          buffIds: ['infliction'],
          sameSourceSkillCast: true,
          operator: 'equal',
          value: 1,
        },
        context,
      ),
    ).toBe(true);
    expect(
      executor.execute(
        {
          kind: 'readBuffStackCount',
          parameters: {
            target: 'caster',
            outputKey: 'count',
            query: { kind: 'id', buffIds: ['infliction'] },
            sameSourceSkillCast: true,
          },
        },
        context,
      ),
    ).toBe(true);
    expect(context.blackboard.getNumber('count')).toBe(1);
  });

  it('releases the exact Buff hold when the ranged operation ends', () => {
    const caster = new CombatBuffContainer('operator', new CombatAttributeSet());
    const buff = caster.add(
      { id: 'ultimate-base', stackingType: 'unlimited', durationSeconds: 1 },
      'operator',
    )!;
    const executor = new BuffOperationExecutor({
      sourceId: 'operator',
      resolveTarget: () => caster,
      delegate,
    });
    const operation = {
      kind: 'holdBuffsById' as const,
      parameters: { target: 'caster' as const, buffIds: ['ultimate-base'] },
    };
    const actionBuffReferencesState = { active: false, references: [] };

    expect(
      executor.execute(operation, {
        blackboard: new ActionBlackboard(),
        actionBuffReferencesState,
      }),
    ).toBe(true);
    expect(buff.isFinishable).toBe(false);

    executor.end(operation, {
      blackboard: new ActionBlackboard(),
      actionBuffReferencesState,
    });

    expect(buff.isFinishable).toBe(true);
  });

  it('releases a restored Buff hold by saved instance references', () => {
    const reference = createTestBuffReference();
    const operation = {
      kind: 'holdBuffsById' as const,
      parameters: { target: 'caster' as const, buffIds: ['ultimate-base'] },
    };
    const originalState = { active: false, references: [] };
    const original = new BuffOperationExecutor({
      sourceId: 'operator',
      resolveTarget: () => ({
        ownerId: reference.ownerId,
        holdByIds: () => ({ references: [reference], release: () => undefined }),
        getCountByIds: () => 0,
        finishByIds: () => 0,
        getCountByTags: () => 0,
        matchesEntityTags: () => false,
        findFirstByIds: () => undefined,
        findFirstByTags: () => undefined,
        finishByTags: () => 0,
      }),
      delegate,
    });
    original.execute(operation, {
      blackboard: new ActionBlackboard(),
      actionBuffReferencesState: originalState,
    });

    const restoredState = structuredClone(originalState);
    const released: unknown[] = [];
    const restored = new BuffOperationExecutor({
      sourceId: 'operator',
      resolveTarget: () => ({
        ownerId: reference.ownerId,
        holdByIds: () => ({ references: [], release: () => undefined }),
        releaseHeld: references => released.push(...references),
        getCountByIds: () => 0,
        finishByIds: () => 0,
        getCountByTags: () => 0,
        matchesEntityTags: () => false,
        findFirstByIds: () => undefined,
        findFirstByTags: () => undefined,
        finishByTags: () => 0,
      }),
      delegate,
    });
    restored.end(operation, {
      blackboard: new ActionBlackboard(),
      actionBuffReferencesState: restoredState,
    });

    expect(released).toEqual([reference]);
    expect(restoredState).toEqual({ active: false, references: [] });
    expect(originalState).toEqual({ active: true, references: [reference] });
  });
});
import { createEventBuff } from '../events/buffEventTestFixture';
