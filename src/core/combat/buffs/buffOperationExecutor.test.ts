import { describe, expect, it, vi } from 'vitest';
import type { ActionGraphStep } from '../../../../packages/game-data-contract/src/actionGraph';
import type { GameplayTag } from '../../../../packages/game-data-contract/src/gameplayTags';
import { chainEntry } from '../../../test/compiledGraphEntry';
import { numberInput, stringInput } from '../../../test/compiledGraphInputs';
import { rootActionSteps } from '../../compiler/actionProgramInspection';
import type { ResolvedSkillBuffDefinition } from '../../compiler/combatProgram';
import { createActionGraphCompilation } from '../../compiler/compileActionGraph';
import { validateSkillDefinition } from '../../game-data/validateSkillDefinition';
import { RuntimeTargetContext } from '../abilities/runtimeTargetContext';
import { TargetContextOperationExecutor } from '../abilities/targetContextOperationExecutor';
import { ActionBlackboard } from '../actions/actionBlackboard';
import { CombatActionSequenceRuntime } from '../actions/combatActionSequenceRuntime';
import { CombatAttributeSet } from '../attributes/combatAttributes';
import { createEventBuff } from '../events/buffEventTestFixture';
import type { AbilityPhysicalInflictionPayload } from '../events/combatAbilityEvent';
import type { CombatOperationExecutor } from '../skills/skillRuntime';
import { GameplayTagRegistry } from '../tags/gameplayTags';
import { BuffDefinitionOperationTarget } from './buffDefinitionOperationTarget';
import {
  BuffOperationExecutor,
  type BuffApplicationRequest,
  type BuffOperationDependencies,
} from './buffOperationExecutor';
import { createTestBuffReference } from './buffTestFixtures';
import { CombatBuffContainer } from './combatBuffs';

const delegate: CombatOperationExecutor = {
  execute: () => false,
  evaluate: () => false,
};

/** 单容器测试使用同一容器接收查询结果；涉及多个对象的测试显式提供实例解析器。 */
function createExecutor(dependencies: BuffOperationDependencies): BuffOperationExecutor {
  const queries = new TargetContextOperationExecutor(dependencies.sourceId, delegate);
  return new BuffOperationExecutor({
    queryTargets: queries.queryTargets.bind(queries),
    resolveEventTarget: id => dependencies.resolveTarget(id === 'enemy' ? 'enemy' : 'caster'),
    ...dependencies,
  });
}

describe('BuffOperationExecutor', () => {
  it.each(['finishBuffsById', 'finishBuffsByTag'] as const)(
    '%s snapshots the truncated count before synchronous finish callbacks',
    kind => {
      for (const reason of ['other', 'early', 'absorbed'] as const) {
        const blackboard = new ActionBlackboard();
        blackboard.assignDynamic('layers', 2.8);
        const counts: number[] = [];
        const sources: (string | undefined)[] = [];
        const sourceGroup = [{ kind: 'operator' as const, operatorId: 'finish-source' }];
        const targets = ['first', 'second'].map(ownerId => {
          const target = new BuffDefinitionOperationTarget(
            new CombatBuffContainer(ownerId, new CombatAttributeSet()),
            {
              get: id => ({ id, stackingType: 'unlimited' as const }),
              compile: entry => ({ id: entry.id, stackingType: 'unlimited' }),
            },
          );
          const finish = (count: number, sourceId?: string) => {
            counts.push(count);
            sources.push(sourceId);
            blackboard.assignDynamic('layers', 9);
            sourceGroup[0] = { kind: 'operator', operatorId: 'changed-source' };
            return count;
          };
          vi.spyOn(target, 'finishCountByIds').mockImplementation(
            (_ids, count, _reason, sourceId) => finish(count, sourceId),
          );
          vi.spyOn(target, 'finishCountByTags').mockImplementation(
            (_tags, _query, count, _reason, _requireAll, sourceId) => finish(count, sourceId),
          );
          return target;
        });
        const executor = createExecutor({
          sourceId: 'operator',
          resolveTarget: () => targets[0]!,
          queryTargets: query => {
            if (query.kind === 'source') {
              if (reason === 'other') throw new Error('Other must not query finishSource');
              blackboard.assignDynamic('layers', 3.8);
              return sourceGroup;
            }
            return targets.map(target => ({ kind: 'operator', operatorId: target.ownerId }));
          },
          resolveEventTarget: id => targets.find(target => target.ownerId === id)!,
          delegate,
        });
        const parameters = {
          targets: { kind: 'characterTeam' as const, excludeOwner: false },
          finishSource: { kind: 'source' as const },
          reason,
          count: numberInput({ kind: 'blackboard', key: 'layers' }),
        };
        executor.execute(
          kind === 'finishBuffsById'
            ? { kind, parameters: { ...parameters, buffIds: ['effect', 'effect'] } }
            : {
                kind,
                parameters: {
                  ...parameters,
                  tagQueryType: 'hasAny',
                  buffTags: ['buff/status/fire'],
                },
              },
          { blackboard },
        );
        const calls = kind === 'finishBuffsById' ? 4 : 2;
        expect(counts).toEqual(Array(calls).fill(reason === 'other' ? 2 : 3));
        expect(sources).toEqual(
          Array(calls).fill(reason === 'other' ? undefined : 'finish-source'),
        );
      }
    },
  );

  it('强制反应先快照参数再消费，零消费直接施加，层数不足不截断后续动作', () => {
    const attachment = 'test-cryo';
    const status = 'buff_common_fire_fire_burning_triggered';
    const tag = 'Skill/Character/Common/SpellInflict/CrystInflict';
    const container = new CombatBuffContainer('enemy', new CombatAttributeSet());
    const target = new BuffDefinitionOperationTarget(container, {
      get: id => ({
        id,
        stackingType: 'unlimited' as const,
        applyTags: id === attachment ? [tag] : [],
      }),
      compile: entry => ({ id: entry.id, stackingType: 'unlimited', applyTags: entry.applyTags }),
    });
    target.apply({ buffId: attachment, sourceId: 'caster', blackboardValues: {} });
    const blackboard = new ActionBlackboard();
    blackboard.assignDynamic('count', 2);
    const countCalculation = {
      operation: 'assign' as const,
      left: 0,
      right: 2,
      result: 2,
      sourceKind: 'buffTagStackCount' as const,
      rightKey: tag,
    };
    blackboard.setValueCalculation('count', countCalculation);
    const finish = target.finishCountByTags.bind(target);
    const consume = vi.spyOn(target, 'finishCountByTags');
    consume.mockImplementation((...args) => {
      const result = finish(...args);
      blackboard.assignDynamic('count', 99);
      return result;
    });
    const apply = vi.spyOn(target, 'apply');
    const executor = new BuffOperationExecutor({
      sourceId: 'caster',
      resolveTarget: () => target,
      resolveBuffDefinition: () => ({ stackingType: 'unlimited' }),
      delegate,
    });
    const parameters = {
      target: 'enemy' as const,
      element: 'heat' as const,
      consumedElement: 'cryo' as const,
      consumedLayers: numberInput({ kind: 'constant', value: 1 }),
      count: numberInput({ kind: 'blackboard', key: 'count' }),
      isExtra: true,
    };
    expect(executor.execute({ kind: 'forceSpellStatus', parameters }, { blackboard })).toBe(true);
    expect(container.getCountByIds([attachment])).toBe(0);
    expect(apply).toHaveBeenLastCalledWith(
      expect.objectContaining({
        buffId: status,
        isExtra: true,
        blackboardValues: { consumed_type: 2, consumed_layer: 1, count: 2 },
        blackboardValueCalculations: { count: countCalculation },
      }),
    );
    apply.mockClear();
    expect(executor.execute({ kind: 'forceSpellStatus', parameters }, { blackboard })).toBe(true);
    expect(apply).not.toHaveBeenCalled();
    executor.execute(
      {
        kind: 'forceSpellStatus',
        parameters: {
          ...parameters,
          consumedLayers: numberInput({ kind: 'constant', value: 0 }),
        },
      },
      { blackboard },
    );
    expect(consume).toHaveBeenCalledTimes(1);
    expect(apply).toHaveBeenCalledTimes(1);
  });

  it('干员附着在多层循环外检查冷却，直接异常消费附着而不派发普通 Before 事件', () => {
    const attached = 'buff_common_enemy_spell_cryst_attached';
    const triggered = 'buff_common_enemy_spell_cryst_triggered_frozen';
    const definition = {
      stackingType: 'unlimited' as const,
      addingCooldownSeconds: 1,
      ignoreAddingCooldown: true,
    };
    const container = new CombatBuffContainer('receiver', new CombatAttributeSet());
    const target = new BuffDefinitionOperationTarget(container, {
      get: id => ({ ...definition, id }),
      compile: entry => ({ ...definition, id: entry.id }),
    });
    const before = vi.fn();
    const executor = new BuffOperationExecutor({
      sourceId: 'source',
      resolveTarget: () => target,
      resolveApplicationTargets: () => [target],
      resolveBuffDefinition: id => (id === attached ? definition : { stackingType: 'unique' }),
      isCharacterTarget: id => id === 'receiver',
      beforeCharacterInfliction: before,
      delegate,
    });
    const parameters = {
      element: 'cryo' as const,
      source: 'caster' as const,
      target: 'caster' as const,
      count: numberInput({ kind: 'constant', value: 3 }),
      directToTriggered: false,
      ignoreWeakImmune: true,
      ignoreAddingCooldown: false,
    };
    const context = { blackboard: new ActionBlackboard() };
    executor.execute({ kind: 'applyCharacterInfliction', parameters }, context);
    expect(container.getCountByIds([attached])).toBe(3);
    executor.execute({ kind: 'applyCharacterInfliction', parameters }, context);
    expect(container.getCountByIds([attached])).toBe(3);
    expect(before).toHaveBeenCalledTimes(2);
    executor.execute(
      { kind: 'applyCharacterInfliction', parameters: { ...parameters, directToTriggered: true } },
      context,
    );
    expect(container.getCountByIds([attached])).toBe(0);
    expect(container.getCountByIds([triggered])).toBe(1);
    expect(before).toHaveBeenCalledTimes(2);
  });

  it('拒绝旧内嵌蓝图，不忽略它或改用目录中的同名定义', () => {
    const parameters = {
      buffs: [{ buffId: 'owned' }],
      targets: { kind: 'fixed', target: 'caster' } as const,
      definition: { stackingType: 'unlimited' as const },
    };
    const step = { kind: 'applyBuff' as const, parameters };
    expect(() => chainEntry('owned-buff', [step])).toThrow(
      'applyBuff must reference an owner Buff definition',
    );
    expect(
      validateSkillDefinition({
        key: 'invalid',
        timelineBlockFrames: 1,
        scheduledSequences: [{ startFrame: 0, sequence: { $sequence: 'step-0' } }],
        actionGraph: { main: { nodes: { 'step-0': { action: step, next: null } } }, macros: {} },
      }),
    ).toContainEqual({
      path: '$.actionGraph.main.nodes."step-0".action.parameters.definition',
      message: 'applyBuff must reference an owner Buff definition',
    });
    const target = Object.assign(new CombatBuffContainer('target', new CombatAttributeSet()), {
      apply: vi.fn(() => true),
    });
    const executor = new BuffOperationExecutor({
      sourceId: 'operator',
      resolveTarget: () => target,
      resolveBuffDefinition: () => ({ stackingType: 'unique' }),
      delegate,
    });
    expect(() => executor.execute(step)).toThrow(
      'applyBuff must reference an owner Buff definition',
    );
    expect(target.apply).not.toHaveBeenCalled();
  });
  it('Buff 黑板查询与施加都使用动作输入目标，不误读 Buff 来源或迭代目标', () => {
    const recipient = Object.assign(new CombatBuffContainer('enemy', new CombatAttributeSet()), {
      apply: vi.fn(() => true),
    });
    recipient.add(
      { id: 'input-value', stackingType: 'unique', blackboard: { value: 8 } },
      'creator',
    );
    const executor = createExecutor({
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
    const definition: readonly ActionGraphStep[] = [
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
        parameters: { buffs: [{ buffId: 'bonus' }], targets: { kind: 'inputTarget' } },
      },
    ];
    const blackboard = new ActionBlackboard();
    const context = {
      blackboard,
      buffSourceId: 'creator',
      actionSourceId: 'creator',
      buffOwnerId: 'holder',
      currentTarget: { kind: 'operator' as const, operatorId: 'other' },
      actionInputTarget: { kind: 'enemy' as const },
    };
    expect(
      new CombatActionSequenceRuntime(executor, context)
        .createSequence(chainEntry('buff-input-target', definition))
        .executeInstant({}),
    ).toBe(true);
    expect(blackboard.getNumber('read-value')).toBe(8);
    expect(recipient.apply).toHaveBeenCalledOnce();
  });
  it.each([false, true])('目录定义仅在护盾读取来源属性时保留属性端口：%s', shield => {
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
    const executor = createExecutor({
      sourceId: 'operator',
      resolveTarget: () => target,
      resolveEventTarget: id => {
        if (id === 'operator') return target;
        if (!shield) throw new Error('来源已经回收，不能索取活动 Buff 容器');
        return source;
      },
      resolveBuffDefinition: () => definition,
      delegate,
    });
    executor.execute(
      {
        kind: 'applyBuff',
        parameters: {
          buffs: [{ buffId: 'counter-or-shield' }],
          targets: { kind: 'fixed', target: 'caster' },
          source: { kind: 'source' },
        },
      },
      { blackboard: new ActionBlackboard(), actionSourceId: source.ownerId },
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
  it.each(['owner', 'source', 'inputTarget'] as const)(
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
      const step: ActionGraphStep = {
        kind: 'finishBuffsByTag',
        parameters: {
          targets: { kind: target },
          finishSource: { kind: 'source' },
          buffTags: ['Test/Tag'],
          tagQueryType: 'hasAny',
          reason: 'early',
        },
      };
      expect(
        validateSkillDefinition({
          key: 'finish',
          skillType: 'basicAttack',
          levelSource: 'basicAttack',
          nativeSkillType: 'attack',
          naturalDurationFrames: 1,
          exclusiveFrame: 0,
          offsetRecordFrame: 0,
          timelineBlockFrames: 1,
          scheduledSequences: [{ startFrame: 0, sequence: { $sequence: 'step-0' } }],
          actionGraph: { main: { nodes: { 'step-0': { action: step, next: null } } }, macros: {} },
        }),
      ).toEqual([]);
      const compiledStep = rootActionSteps(chainEntry('finish-by-tag', [step]))[0]!;
      if (compiledStep.kind !== 'finishBuffsByTag') throw new Error('unexpected compiled step');
      const executor = createExecutor({
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
        executor.execute(compiledStep, {
          blackboard: new ActionBlackboard(),
          actionOwnerId: 'recipient',
          actionSourceId: 'recipient',
          actionInputTarget: { kind: 'operator', operatorId: 'recipient' },
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
    const executor = createExecutor({
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
        parameters: {
          targets: { kind: 'fixed', target: 'caster' },
          finishSource: { kind: 'source' },
          buffIds: ['buff'],
          reason: 'other',
        },
      },
      {
        blackboard: new ActionBlackboard(),
        ...(hasSource ? { skillCastInfo: source } : {}),
        eventSkillCastInfo: { ...source, skillCastId: 2, originSkillId: 'event' },
      },
    );
    expect(finish).toHaveBeenCalledWith(['buff'], 'other', undefined, hasSource ? source : null);
  });
  it.each([false, true])('CreateBuff继承动作环境而非触发事件，宿主来源存在=%s', hasHost => {
    const apply = vi.fn((_request: unknown) => true);
    const target = Object.assign(new CombatBuffContainer('caster', new CombatAttributeSet()), {
      apply,
    });
    const executor = createExecutor({
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
            parameters: {
              buffs: [{ buffId: 'phantom' }],
              targets: { kind: 'fixed', target: 'caster' },
              inheritSourceSkillCastInfo,
            },
          },
          {
            blackboard: new ActionBlackboard(),
            actionSourceId: 'caster',
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
    const executor = createExecutor({
      sourceId: 'caster',
      resolveTarget: () => target,
      delegate,
    });
    expect(
      executor.execute(
        {
          kind: 'finishBuffsById',
          parameters: {
            targets: { kind: 'fixed', target: 'caster' },
            finishSource: { kind: 'source' },
            buffIds: ['missing'],
            reason: 'other',
          },
        },
        { blackboard: new ActionBlackboard() },
      ),
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
    const executor = createExecutor({
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
        parameters: {
          buffs: [{ buffId: 'child' }],
          targets: { kind: 'inputTarget' },
          source: { kind: 'context', key: 'source' },
        },
      },
      {
        blackboard: new ActionBlackboard(),
        targetContext,
        currentTarget,
        actionInputTarget: currentTarget,
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
    const executor = createExecutor({
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
        parameters: {
          targets: { kind: 'inputTarget' },
          finishSource: { kind: 'source' },
          buffIds: ['buff.fixture'],
          reason: 'other',
        },
      },
      {
        blackboard: new ActionBlackboard(),
        actionInputTarget: currentTarget,
        buffSourceId: 'original',
      },
    );
    expect(resolve).toHaveBeenCalledWith(expectedId);
    expect(finish).toHaveBeenCalledWith(['buff.fixture'], 'other', undefined, null);
  });
  it('Context 来源使用已查询身份，不取原 Buff 来源或受益干员', () => {
    const apply = vi.fn(() => true);
    const receiver = Object.assign(new CombatBuffContainer('receiver', new CombatAttributeSet()), {
      apply,
    });
    const targetContext = new RuntimeTargetContext();
    targetContext.set('seraph', [{ kind: 'operator', operatorId: 'xaihi' }]);
    const executor = createExecutor({
      sourceId: 'receiver',
      resolveTarget: () => receiver,
      resolveEventTarget: id => {
        expect(id).toBe('receiver');
        return receiver;
      },
      delegate,
    });
    const step = {
      kind: 'applyBuff' as const,
      parameters: {
        buffs: [{ buffId: 'child' }],
        targets: { kind: 'fixed', target: 'caster' } as const,
        source: { kind: 'context' as const, key: 'seraph' },
      },
    };
    const context = {
      blackboard: new ActionBlackboard(),
      targetContext,
      buffSourceId: 'ability-entity:3',
    };
    executor.execute(step, context);
    expect(apply).toHaveBeenCalledWith(expect.objectContaining({ sourceId: 'xaihi' }));
    targetContext.set('seraph', [{ kind: 'operator', operatorId: 'xaihi' }, { kind: 'enemy' }]);
    expect(executor.execute(step, context)).toBe(true);
    expect(apply).toHaveBeenLastCalledWith(expect.objectContaining({ sourceId: 'xaihi' }));
    const skipped = {
      ...step,
      parameters: {
        ...step.parameters,
        buffs: [{ buffId: stringInput('unread') }],
      },
    };
    for (const group of [
      [],
      [{ kind: 'spatialPoint' as const, pointId: 1 }, { kind: 'enemy' as const }],
    ]) {
      targetContext.set('seraph', group);
      expect(executor.execute(skipped, context)).toBe(true);
    }
    expect(
      executor.execute(
        {
          ...skipped,
          parameters: { ...skipped.parameters, source: { kind: 'context', key: 'missing' } },
        },
        context,
      ),
    ).toBe(true);
    expect(apply).toHaveBeenCalledTimes(2);
  });
  it.each([
    [undefined, undefined, undefined],
    ['ability-entity:3', undefined, undefined],
    ['ability-entity:3', 'enhancer', 'enhancer'],
  ] as const)(
    '默认来源使用动作上下文而非宿主：%s / %s',
    (buffSourceId, actionSourceId, expected) => {
      const apply = vi.fn(() => true);
      const receiver = Object.assign(
        new CombatBuffContainer('receiver', new CombatAttributeSet()),
        { apply },
      );
      const executor = createExecutor({
        sourceId: 'receiver',
        resolveTarget: () => receiver,
        delegate,
      });
      executor.execute(
        {
          kind: 'applyBuff',
          parameters: {
            buffs: [{ buffId: 'child' }],
            targets: { kind: 'fixed', target: 'caster' },
          },
        },
        {
          blackboard: new ActionBlackboard(),
          buffOwnerId: 'receiver',
          buffSourceId,
          actionSourceId,
        },
      );
      if (expected === undefined) expect(apply).not.toHaveBeenCalled();
      else expect(apply).toHaveBeenCalledWith(expect.objectContaining({ sourceId: expected }));
    },
  );

  it('把能力实体 ActionOwner 解析为只读图标倒计时来源', () => {
    const apply = vi.fn(() => true);
    const receiver = Object.assign(new CombatBuffContainer('enemy', new CombatAttributeSet()), {
      apply,
    });
    const executor = createExecutor({
      sourceId: 'operator',
      resolveTarget: () => receiver,
      delegate,
    });
    const step = {
      kind: 'applyBuff' as const,
      parameters: {
        buffs: [{ buffId: 'weakness' }],
        targets: { kind: 'fixed', target: 'enemy' } as const,
        iconDurationSource: { kind: 'actionOwnerAbilityEntity' as const },
      },
    };

    expect(() =>
      executor.execute(step, { blackboard: new ActionBlackboard(), actionSourceId: 'operator' }),
    ).toThrow('requires an AbilityEntity action owner');
    executor.execute(step, {
      blackboard: new ActionBlackboard(),
      actionSourceId: 'operator',
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
    const executor = createExecutor({
      sourceId: 'operator',
      resolveTarget: () => receiver,
      resolveAbilityEntityTimedMarkerSource,
      delegate,
    });
    const step = {
      kind: 'applyBuff' as const,
      parameters: {
        buffs: [{ buffId: 'weakness' }],
        targets: { kind: 'fixed', target: 'enemy' } as const,
        iconDurationSource: {
          kind: 'actionOwnerTimedMarker' as const,
          markerId: 'ultimate-window',
        },
      },
    };
    const actionOwnerAbilityEntity = { kind: 'abilityEntity' as const, instanceId: 7 };

    executor.execute(step, {
      blackboard: new ActionBlackboard(),
      actionSourceId: 'operator',
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
    const executor = createExecutor({
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
            buffs: [{ buffId: 'weakness' }],
            targets: { kind: 'fixed', target: 'enemy' },
            iconDurationSource: {
              kind: 'actionOwnerTimedMarker',
              markerId: 'missing',
            },
          },
        },
        {
          blackboard: new ActionBlackboard(),
          actionSourceId: 'operator',
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
    const executor = createExecutor({
      sourceId: 'operator',
      resolveTarget: () => receiver,
      resolveBuffDefinition: id => (id === 'carrier' ? baseDefinition : undefined),
      delegate,
    });
    executor.execute(
      {
        kind: 'applyBuff',
        parameters: {
          buffs: [
            {
              buffId: 'carrier',
              blackboardAssignments: {
                rate: numberInput({ kind: 'blackboard', key: 'base_rate' }),
              },
              keywordEnhancements: [
                {
                  triggerBuffIds: ['trigger'],
                  operation: 'add',
                  value: numberInput({ kind: 'blackboard', key: 'bonus' }),
                },
              ],
            },
          ],
          targets: { kind: 'fixed', target: 'caster' },
        },
      },
      {
        blackboard: new ActionBlackboard({ base_rate: 0.2, bonus: 0.05 }),
        actionSourceId: 'operator',
      },
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

  it.each(['source', 'owner'] as const)(
    '显式 %s 来源不被当前事件施加者覆盖，缺身份跳过创建',
    sourceKind => {
      const owner = new CombatBuffContainer('enemy', new CombatAttributeSet());
      const source = new CombatBuffContainer('weapon-holder', new CombatAttributeSet());
      const apply = vi.fn(() => true);
      const receiver = Object.assign(
        new CombatBuffContainer('receiver', new CombatAttributeSet()),
        { apply },
      );
      const executor = createExecutor({
        sourceId: 'wrong-default',
        resolveTarget: () => receiver,
        resolveEventTarget: id => {
          if (id === 'wrong-default') return receiver;
          if (id === owner.ownerId) return owner;
          if (id === source.ownerId) return source;
          throw new Error(`unexpected entity ${id}`);
        },
        delegate,
      });
      const step = {
        kind: 'applyBuff' as const,
        parameters: {
          buffs: [{ buffId: 'child' }],
          targets: { kind: 'fixed', target: 'caster' } as const,
          source: { kind: sourceKind },
        },
      };
      const context = {
        blackboard: new ActionBlackboard(),
        buffOwnerId: owner.ownerId,
        buffSourceId: source.ownerId,
        actionOwnerId: owner.ownerId,
        actionSourceId: source.ownerId,
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
          sourceId: sourceKind === 'source' ? 'weapon-holder' : 'enemy',
        }),
      );
      apply.mockClear();
      executor.execute(step, { blackboard: context.blackboard, event: context.event });
      expect(apply).not.toHaveBeenCalled();
    },
  );

  it('rejects a target without a scoped application port for cast attachment', () => {
    const execute = vi.fn(() => true);
    const executor = createExecutor({
      sourceId: 'operator',
      resolveTarget: () => new CombatBuffContainer('operator', new CombatAttributeSet()),
      delegate: { ...delegate, execute },
    });
    expect(() =>
      executor.execute(
        {
          kind: 'applyBuff',
          parameters: {
            buffs: [{ buffId: 'attached' }],
            targets: { kind: 'fixed', target: 'caster' },
            lifetimeOwner: 'currentCastSkill',
          },
        },
        { blackboard: new ActionBlackboard(), actionSourceId: 'operator' },
      ),
    ).toThrow('scoped Buff application port');
    expect(execute).not.toHaveBeenCalled();
  });
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
          value: numberInput({ kind: 'blackboard', key: 'required' }),
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
          value: numberInput({ kind: 'blackboard', key: 'required' }),
        },
        context,
      ),
    ).toBe(false);
  });

  it('applies the first no-guard layer before executing the fracture Buff chain', () => {
    let noGuardCount = 0;
    const applied: string[] = [];
    const beforeOutput: Array<AbilityPhysicalInflictionPayload> = [];
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
      resolveBuffDefinition: () => ({ stackingType: 'refresh' }),
      delegate,
    });
    const step = {
      kind: 'applyPhysicalInfliction' as const,
      parameters: {
        type: 'fracture' as const,
        target: 'enemy' as const,
        isExtra: false,
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
      resolveBuffDefinition: () => ({ stackingType: 'refresh' }),
      delegate,
    });
    const parameters = {
      type: 'airborne' as const,
      target: 'enemy' as const,
      isExtra: false,
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
    const applied: BuffApplicationRequest[] = [];
    const target = {
      ownerId: 'enemy',
      apply: (request: BuffApplicationRequest) => {
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
      resolveBuffDefinition: () => ({ stackingType: 'refresh' }),
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
            damageMultiplier: numberInput({ kind: 'blackboard', key: 'crush_multi' }),
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
    const executor = createExecutor({
      sourceId: 'operator',
      resolveTarget: () => target,
      delegate,
    });
    const step = {
      kind: 'applyBuff' as const,
      parameters: {
        buffs: [{ buffId: 'aura-buff' }],
        targets: { kind: 'fixed', target: 'enemy' } as const,
        finishByAction: true,
      },
    };
    const actionBuffReferencesState = { active: false, references: [] };

    expect(
      executor.execute(step, {
        blackboard: new ActionBlackboard(),
        actionSourceId: 'operator',
        actionBuffReferencesState,
      }),
    ).toBe(true);
    expect(finished).toEqual([]);

    executor.end(step, {
      blackboard: new ActionBlackboard(),
      actionSourceId: 'operator',
      actionBuffReferencesState,
    });
    expect(finished).toEqual(['other']);
  });

  it('Aura 结束先回收创建的实例，再清理指定 Owner，而不是对离场目标查同名 Buff', () => {
    const calls: string[] = [];
    const sources: string[] = [];
    const target = {
      ownerId: 'enemy',
      applyScoped: (request: BuffApplicationRequest) => {
        sources.push(request.sourceId);
        return {
          isRecycled: false,
          reference: createTestBuffReference(),
          finish: () => {
            calls.push('instance');
            return true;
          },
        };
      },
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
    const executor = createExecutor({
      sourceId: 'operator',
      resolveTarget: recipient => (recipient === 'caster' ? owner : target),
      delegate,
      resolveEventTarget: id => (id === 'enemy' ? target : owner),
    });
    const program = createActionGraphCompilation(
      {
        nodes: {
          aura: {
            action: {
              kind: 'aura',
              parameters: {
                targets: { kind: 'fixed', target: 'enemy' },
                source: { kind: 'owner' },
                buffs: [{ buffId: 'aura' }],
              },
              onEnter: { $sequence: null },
              onExit: { $sequence: 'cleanup' },
            },
            next: null,
          },
          cleanup: {
            action: {
              kind: 'finishBuffsById',
              parameters: {
                targets: { kind: 'fixed', target: 'caster' },
                finishSource: { kind: 'source' },
                buffIds: ['aura'],
                reason: 'other',
              },
            },
            next: null,
          },
        },
      },
      1,
    ).compileAll();
    const runtime = new CombatActionSequenceRuntime(executor, {
      blackboard: new ActionBlackboard(),
      actionOwnerId: 'operator',
      actionSourceId: 'teammate',
    });
    const action = runtime.createGraphSequence(program, 'aura', 'root');
    action.tryExecute({});
    expect(sources).toEqual(['operator']);
    expect(calls).toEqual([]);
    action.end({});
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
    const executor = createExecutor({
      sourceId: 'operator',
      resolveTarget: () => target,
      delegate,
    });
    const step = {
      kind: 'applyBuff' as const,
      parameters: {
        buffs: [{ buffId: 'cancel-entity' }],
        targets: { kind: 'fixed', target: 'caster' } as const,
        finishByAction: true,
        inheritToNextSkillIds: ['native.attack1'],
      },
    };
    const detachBuffFromCurrentSkill = vi.fn();
    const attachBuffToNextSkill = vi.fn();
    const actionBuffReferencesState = { active: false, references: [] };

    executor.execute(step, {
      blackboard: new ActionBlackboard(),
      actionSourceId: 'operator',
      actionBuffReferencesState,
    });
    executor.end(step, {
      blackboard: new ActionBlackboard(),
      actionSourceId: 'operator',
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
          buffs: [{ buffId: 'branch-aura' }],
          targets: { kind: 'fixed', target: 'enemy' } as const,
          finishByAction: true,
        },
      };
      const originalState = { active: false, references: [] };
      const original = createExecutor({
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
        actionSourceId: 'operator',
        actionBuffReferencesState: originalState,
      });

      const restoredState = structuredClone(originalState);
      oldHandle.isFinished = recycled;
      oldHandle.isRecycled = recycled;
      const newFinish = vi.fn(() => true);
      const newHandle = { isRecycled: false, reference, finish: newFinish };
      const restored = createExecutor({
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
        actionSourceId: 'operator',
        actionBuffReferencesState: restoredState,
      });

      if (recycled) expect(newFinish).not.toHaveBeenCalled();
      else expect(newFinish).toHaveBeenCalledExactlyOnceWith('other');
      expect(oldFinish).not.toHaveBeenCalled();
      expect(restoredState).toEqual({ active: false, references: [] });
      expect(originalState).toEqual({ active: true, references: [reference] });
      original.end(step, {
        blackboard: new ActionBlackboard(),
        actionSourceId: 'operator',
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
    const executor = createExecutor({
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

  it.each([
    { nextSkillId: undefined, finishByAction: true, attach: true, finishes: true },
    { nextSkillId: 'native.other', finishByAction: true, attach: true, finishes: true },
    { nextSkillId: 'native.other', finishByAction: true, attach: false, finishes: true },
    { nextSkillId: 'native.followup', finishByAction: true, attach: false, finishes: false },
    { nextSkillId: 'native.followup', finishByAction: false, attach: true, finishes: false },
    { nextSkillId: 'native.other', finishByAction: false, attach: true, finishes: false },
  ])(
    'respects inheritance policy without attaching: %j',
    ({ nextSkillId, finishByAction, attach, finishes }) => {
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
          finishByAction,
          finishWithNextSkillIfNotInherited: attach,
        },
      };
      const actionBuffReferencesState = { active: false, references: [] };

      executor.execute(step, {
        blackboard: new ActionBlackboard(),
        actionBuffReferencesState,
        detachBuffFromCurrentSkill: () => undefined,
      });
      const attachBuffToNextSkill = vi.fn();
      executor.end(step, {
        blackboard: new ActionBlackboard(),
        actionBuffReferencesState,
        ...(nextSkillId === undefined ? {} : { pendingNextSkillId: nextSkillId }),
        attachBuffToNextSkill,
      });

      expect(attachBuffToNextSkill).not.toHaveBeenCalled();
      expect(finish).toHaveBeenCalledTimes(finishes ? 1 : 0);
      if (finishes) expect(finish).toHaveBeenCalledWith('other');
      expect(actionBuffReferencesState).toEqual({ active: false, references: [] });
    },
  );

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
    const executor = createExecutor({
      sourceId: 'operator',
      resolveTarget: () => target,
      delegate,
    });

    const execute = () =>
      executor.execute(
        {
          kind: 'applyBuff',
          parameters: {
            buffs: [{ buffId: 'child' }],
            targets: { kind: 'fixed', target: 'caster' },
            ...(usesAttachingSkillLifetime
              ? { lifetimeOwner: 'currentCastSkill' as const }
              : { asChildBuff: true }),
          },
        },
        {
          blackboard: new ActionBlackboard(),
          actionSourceId: 'operator',
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

  it.each(['actionSource', 'actionOwner', 'none'] as const)(
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
            ...(finishSource === 'none'
              ? {
                  skillCastInfo: {
                    skillCastId: 42,
                    originSkillId: 'own',
                    originSkillType: 'battleSkill' as const,
                    nonReturnedSpCost: 0,
                  },
                }
              : {}),
            eventSkillCastInfo: {
              skillCastId: 99,
              originSkillId: 'event',
              originSkillType: 'comboSkill',
              nonReturnedSpCost: 10,
            },
            finishCurrentBuff: (reason, sourceId, cast) => {
              expect(sourceId).toBe(
                finishSource === 'none'
                  ? undefined
                  : finishSource === 'actionSource'
                    ? 'action-source'
                    : 'buff-owner',
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
    const executor = createExecutor({
      sourceId: 'operator',
      resolveTarget: () => {
        throw new Error('current ability entity must not resolve through CombatTarget');
      },
      resolveEventTarget: () => entityTarget,
      delegate,
    });

    expect(
      executor.execute(
        {
          kind: 'finishBuffsById',
          parameters: {
            targets: { kind: 'inputTarget' },
            finishSource: { kind: 'source' },
            buffIds: ['effect', 'effect-line'],
            reason: 'other',
          },
        },
        {
          blackboard: new ActionBlackboard(),
          actionInputTarget: { kind: 'abilityEntity', instanceId: 7 },
        },
      ),
    ).toBe(true);
    expect(finished).toEqual([['effect'], ['effect-line']]);
  });

  it('resolves a partial Buff finish count from the current action blackboard', () => {
    const calls: { ids: readonly string[]; count: number; reason: string }[] = [];
    const executor = createExecutor({
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
            targets: { kind: 'fixed', target: 'caster' },
            finishSource: { kind: 'source' },
            buffIds: ['preparation'],
            reason: 'other',
            count: numberInput({ kind: 'blackboard', key: 'layers' }),
          },
        },
        { blackboard },
      ),
    ).toBe(true);
    expect(calls).toEqual([{ ids: ['preparation'], count: 1, reason: 'other' }]);
  });

  it('resolves a partial tag Buff finish count from the current action blackboard', () => {
    const calls: { tags: readonly GameplayTag[]; count: number; reason: string }[] = [];
    const executor = createExecutor({
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
            targets: { kind: 'fixed', target: 'enemy' },
            finishSource: { kind: 'source' },
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

  it('uses container order for lifetime reads and preserves the native write tolerance', () => {
    const container = new CombatBuffContainer('operator', new CombatAttributeSet());
    const target = new BuffDefinitionOperationTarget(container, {
      get: () => undefined,
      compile: entry => ({ id: entry.id, stackingType: entry.stackingType }),
    });
    for (const [id, durationSeconds] of [
      ['first', 9],
      ['second', 3],
      ['infinite', undefined],
    ] as const)
      container.add({ id, stackingType: 'unlimited', durationSeconds }, 'source');
    const blackboard = new ActionBlackboard();
    const executor = new BuffOperationExecutor({
      sourceId: 'operator',
      delegate,
      queryTargets: () => [{ kind: 'operator', operatorId: 'operator' }],
      resolveEventTarget: () => target,
      resolveTarget: () => target,
    });
    const step = {
      kind: 'readBuffRemainingDuration' as const,
      parameters: {
        target: { kind: 'context' as const, key: 'src' },
        query: { kind: 'id' as const, buffIds: ['second', 'first', 'infinite'] },
        outputKey: 'remaining',
      },
    };
    expect(executor.execute(step, { blackboard })).toBe(true);
    expect(blackboard.getNumber('remaining')).toBe(3);
    blackboard.assignDynamicUnconditionally('remaining', 3.000001);
    executor.execute(step, { blackboard });
    expect(blackboard.getNumber('remaining')).toBe(3.000001);
    expect(
      executor.execute(
        {
          ...step,
          parameters: { ...step.parameters, query: { kind: 'id', buffIds: ['missing'] } },
        },
        { blackboard },
      ),
    ).toBe(true);
    expect(blackboard.getNumber('remaining')).toBe(0);
  });

  it('reads the selected environment Buff and clears a previous finite result for infinity', () => {
    const blackboard = new ActionBlackboard();
    const target = new BuffDefinitionOperationTarget(
      new CombatBuffContainer('operator', new CombatAttributeSet()),
      {
        get: () => undefined,
        compile: entry => ({ id: entry.id, stackingType: entry.stackingType }),
      },
    );
    const executor = new BuffOperationExecutor({
      sourceId: 'operator',
      queryTargets: () => [{ kind: 'operator', operatorId: 'operator' }],
      resolveEventTarget: () => target,
      resolveTarget: () => {
        throw new Error('unexpected fixed target');
      },
      delegate,
    });
    const step = {
      kind: 'readBuffRemainingDuration' as const,
      parameters: {
        target: { kind: 'owner' as const },
        query: { kind: 'environment' as const },
        outputKey: 'duration_dynamic',
      },
    };
    const context = { blackboard, buffOwnerId: 'operator' };
    expect(executor.execute(step, { ...context, getCurrentBuffRemainingDuration: () => 7.5 })).toBe(
      true,
    );
    expect(blackboard.getNumber('duration_dynamic')).toBe(7.5);
    executor.execute(step, { ...context, getCurrentBuffRemainingDuration: () => null });
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
    const executor = createExecutor({
      sourceId: 'operator',
      resolveTarget: () => target,
      delegate,
    });
    const blackboard = new ActionBlackboard({ rate: 4 });
    blackboard.setArtsIntensityFactor('rate', 2);

    expect(
      executor.execute(
        {
          kind: 'applyBuff',
          parameters: {
            buffs: [
              {
                buffId: 'ultimate-base',
                blackboardAssignments: {
                  duration: { kind: 'constant', value: 25 },
                  comboRate: numberInput({ kind: 'blackboard', key: 'rate' }),
                },
                stringBlackboardAssignments: {
                  child_buff_id: 'buff:icon',
                },
              },
            ],
            targets: { kind: 'fixed', target: 'caster' },
          },
        },
        { blackboard, actionSourceId: 'operator' },
      ),
    ).toBe(true);
    expect(applied).toEqual([
      {
        buffId: 'ultimate-base',
        definitionOwnerId: 'operator',
        sourceId: 'operator',
        blackboardValues: { duration: 25, comboRate: 4, child_buff_id: 'buff:icon' },
        blackboardArtsIntensityFactors: { comboRate: { multiplier: 2 } },
      },
    ]);

    expect(
      executor.execute(
        {
          kind: 'applyBuff',
          parameters: {
            buffs: [{ buffId: 'external-event-buff' }],
            targets: { kind: 'fixed', target: 'caster' },
            inheritSourceSkillCastInfo: true,
          },
        },
        { blackboard: new ActionBlackboard(), actionSourceId: 'operator' },
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
    const executor = createExecutor({
      sourceId: 'operator',
      resolveTarget: () => target,
      resolveBuffDefinition: buffId => (buffId === 'operator-mark' ? definition : undefined),
      delegate,
    });

    expect(
      executor.execute(
        {
          kind: 'applyBuff',
          parameters: {
            buffs: [{ buffId: 'operator-mark' }],
            targets: { kind: 'fixed', target: 'caster' },
          },
        },
        { blackboard: new ActionBlackboard(), actionSourceId: 'operator' },
      ),
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
    const executor = createExecutor({
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
      actionOwnerId: 'operator-b',
      actionSourceId: 'operator-a',
    };

    expect(
      executor.execute(
        {
          kind: 'applyBuff',
          parameters: { buffs: [{ buffId: 'owner-child' }], targets: { kind: 'owner' } },
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
    const executor = createExecutor({
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
          parameters: {
            buffs: [{ buffId: 'healing-trigger-buff' }],
            targets: { kind: 'inputTarget' },
          },
        },
        {
          blackboard: new ActionBlackboard(),
          actionSourceId: 'operator-a',
          actionInputTarget: { kind: 'operator', operatorId: 'operator-b' },
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
    'uses explicit ActionSource independently of a live event (%s)',
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
      const executor = createExecutor({
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
              buffs: [{ buffId: 'event-source-buff' }],
              targets: { kind: 'source' },
              source: { kind: 'source' },
            },
          },
          {
            blackboard: new ActionBlackboard(),
            actionSourceId: 'operator-b',
            ...(liveEvent
              ? {
                  event: {
                    event: 'beforeCastSkill' as const,
                    payload: {
                      sourceId: 'event-source',
                      targetId: 'event-target',
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
    const executor = createExecutor({
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
            buffs: [{ buffId: 'lifecycle-child' }],
            targets: { kind: 'owner' },
            source: { kind: 'source' },
          },
        },
        {
          blackboard: new ActionBlackboard(),
          buffOwnerId: owner.ownerId,
          buffSourceId: source.ownerId,
          actionOwnerId: owner.ownerId,
          actionSourceId: source.ownerId,
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
        ownerId: 'enemy',
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
    const executor = createExecutor({
      sourceId: 'operator',
      resolveTarget: target => targets[target],
      delegate,
    });

    expect(
      executor.execute(
        {
          kind: 'applyBuff',
          parameters: {
            buffs: [{ buffId: 'mark' }],
            targets: { kind: 'fixed', target: 'enemy' },
            source: { kind: 'fixed', target: 'enemy' },
          },
        },
        { blackboard: new ActionBlackboard() },
      ),
    ).toBe(true);
    expect(applied).toEqual([
      {
        buffId: 'mark',
        definitionOwnerId: 'operator',
        sourceId: 'enemy',
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
    const executor = createExecutor({
      sourceId: 'operator',
      resolveTarget: () => target,
      delegate,
    });

    expect(
      executor.execute(
        {
          kind: 'applyBuff',
          parameters: {
            buffs: [{ buffId: 'entity-sourced-mark' }],
            targets: { kind: 'fixed', target: 'enemy' },
            source: { kind: 'inputTarget' },
          },
        },
        {
          blackboard: new ActionBlackboard(),
          actionInputTarget: { kind: 'abilityEntity', instanceId: 7 },
        },
      ),
    ).toBe(true);
    expect(applied).toEqual([expect.objectContaining({ sourceId: 'ability-entity:7' })]);
  });

  it('按目标、次数、Buff 条目顺序施加，每项动态读取而次数只读取一次', () => {
    const blackboard = new ActionBlackboard({ count: 1.5, value: 0 });
    const targetContext = new RuntimeTargetContext();
    targetContext.set('source', [{ kind: 'operator', operatorId: 'original' }]);
    const sources: string[] = [];
    const applied: { target: string; id: string; value: number }[] = [];
    const makeTarget = (id: string) =>
      Object.assign(new CombatBuffContainer(id, new CombatAttributeSet()), {
        apply: (request: BuffApplicationRequest) => {
          sources.push(request.sourceId);
          applied.push({
            target: id,
            id: request.buffId,
            value: request.blackboardValues.value as number,
          });
          blackboard.assignDynamic('value', applied.length);
          blackboard.assignDynamic('count', 0);
          targetContext.set('source', [{ kind: 'operator', operatorId: 'changed' }]);
          return false; // 单项添加失败不截断其余条目或次数。
        },
      });
    const first = makeTarget('first'),
      second = makeTarget('second');
    const executor = createExecutor({
      sourceId: 'operator',
      resolveTarget: () => first,
      queryTargets: (query, context) =>
        query.kind === 'context'
          ? (context.targetContext!.getOptional(query.key) ?? [])
          : [
              { kind: 'operator', operatorId: 'first' },
              { kind: 'operator', operatorId: 'second' },
            ],
      resolveEventTarget: id => (id === 'first' ? first : second),
      delegate,
    });
    expect(
      executor.execute(
        {
          kind: 'applyBuff',
          parameters: {
            targets: { kind: 'characterTeam', excludeOwner: false },
            source: { kind: 'context', key: 'source' },
            count: numberInput({ kind: 'blackboard', key: 'count' }),
            buffs: ['a', 'b'].map(buffId => ({
              buffId,
              blackboardAssignments: { value: numberInput({ kind: 'blackboard', key: 'value' }) },
            })),
          },
        },
        { blackboard, targetContext },
      ),
    ).toBe(true);
    expect(applied).toEqual([
      { target: 'first', id: 'a', value: 0 },
      { target: 'first', id: 'b', value: 1 },
      { target: 'first', id: 'a', value: 2 },
      { target: 'first', id: 'b', value: 3 },
      { target: 'second', id: 'a', value: 4 },
      { target: 'second', id: 'b', value: 5 },
      { target: 'second', id: 'a', value: 6 },
      { target: 'second', id: 'b', value: 7 },
    ]);
    expect(sources).toEqual([
      'original',
      'original',
      'original',
      'original',
      'changed',
      'changed',
      'changed',
      'changed',
    ]);
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
      executor.evaluate(
        { ...condition, value: numberInput({ kind: 'blackboard', key: 'threshold' }) },
        context,
      ),
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
      resolveEventTarget: () => target,
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
    const targetContext = new RuntimeTargetContext();
    const groupCondition = {
      kind: 'contextTargetEntityTagMatch' as const,
      contextKey: 'group',
      tagQueryType: 'hasAny' as const,
      tags: [parentPath],
    };
    const context = { blackboard: new ActionBlackboard(), targetContext };
    expect(executor.evaluate(groupCondition, context)).toBe(false);
    targetContext.set('group', [{ kind: 'operator', operatorId: 'operator' }]);
    expect(executor.evaluate(groupCondition, context)).toBe(true);
    const untagged = new CombatBuffContainer(
      'enemy',
      new CombatAttributeSet(),
      new GameplayTagRegistry([parentPath, childPath]),
    );
    const grouped = new BuffOperationExecutor({
      sourceId: 'operator',
      resolveTarget: () => target,
      delegate,
      resolveEventTarget: id => (id === 'enemy' ? untagged : target),
    });
    targetContext.set('group', [{ kind: 'operator', operatorId: 'operator' }, { kind: 'enemy' }]);
    expect(grouped.evaluate(groupCondition, context)).toBe(false);
    untagged.addEntityTags([childPath]);
    expect(grouped.evaluate(groupCondition, context)).toBe(true);
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
    const executor = createExecutor({
      sourceId: 'operator',
      resolveTarget: () => target,
      delegate,
    });

    expect(
      executor.execute(
        {
          kind: 'finishBuffsByTag',
          parameters: {
            targets: { kind: 'fixed', target: 'enemy' },
            finishSource: { kind: 'source' },
            tagQueryType: 'hasAny',
            buffTags: [path],
            reason: 'early',
          },
        },
        { blackboard: new ActionBlackboard() },
      ),
    ).toBe(true);
    expect(first?.finishReason).toBe('early');
    expect(second?.finishReason).toBe('early');
    expect(unrelated?.isFinished).toBe(false);
  });

  it('按标签清除全队状态，各目标保留不匹配的 Buff', () => {
    const members = ['a', 'b'].map(id => new CombatBuffContainer(id, new CombatAttributeSet()));
    const frozen = members.map(member =>
      member.add({ id: 'frozen', stackingType: 'unlimited', applyTags: ['Frozen'] }, 'a'),
    );
    const other = members[1]!.add(
      { id: 'other', stackingType: 'unlimited', applyTags: ['Other'] },
      'a',
    );
    const executor = createExecutor({
      sourceId: 'a',
      delegate,
      resolveTarget: () => members[0]!,
      queryTargets: () => members.map(member => ({ kind: 'operator', operatorId: member.ownerId })),
      resolveEventTarget: id => members.find(member => member.ownerId === id)!,
    });
    executor.execute(
      {
        kind: 'finishBuffsByTag',
        parameters: {
          targets: { kind: 'characterTeam', excludeOwner: false },
          finishSource: { kind: 'source' },
          tagQueryType: 'hasAny',
          buffTags: ['Frozen'],
          reason: 'other',
        },
      },
      { blackboard: new ActionBlackboard() },
    );
    expect(frozen.map(buff => buff?.isFinished)).toEqual([true, true]);
    expect(other?.isFinished).toBe(false);
  });

  it('queries and finishes caster buffs by stable Buff identity', () => {
    const caster = new CombatBuffContainer('operator', new CombatAttributeSet());
    const active = caster.add(
      { id: 'sword-trigger', stackingType: 'stack', maxStackCount: 3 },
      'operator',
    );
    caster.add({ id: 'sword-trigger', stackingType: 'stack', maxStackCount: 3 }, 'operator');
    const executor = createExecutor({
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
          value: numberInput({ kind: 'blackboard', key: 'expectedStacks' }),
        },
        { blackboard: new ActionBlackboard({ expectedStacks: 2 }) },
      ),
    ).toBe(true);
    expect(
      executor.execute(
        {
          kind: 'finishBuffsById',
          parameters: {
            targets: { kind: 'fixed', target: 'caster' },
            finishSource: { kind: 'source' },
            buffIds: ['sword-trigger'],
            reason: 'other',
          },
        },
        { blackboard: new ActionBlackboard() },
      ),
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
