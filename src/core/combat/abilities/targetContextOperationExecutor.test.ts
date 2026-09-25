import { describe, expect, it, vi } from 'vitest';
import { ActionBlackboard } from '../actions/actionBlackboard';
import { CombatVitals } from '../resources/combatVitals';
import { RuntimeTargetContext } from './runtimeTargetContext';
import { TargetContextOperationExecutor } from './targetContextOperationExecutor';
import { ProjectileLifecycleRuntime } from './projectileLifecycleRuntime';

const terminal = {
  execute: () => false,
  evaluate: () => false,
};

function vitals(health: number): CombatVitals {
  return new CombatVitals({
    health,
    maxHealth: 1000,
    maxPoise: 0,
    poise: 0,
    poiseRecoveryTime: 0,
    poiseRecoveryTimeMultiplier: 0,
    poiseBrokenEndTime: 0,
    poiseImmune: false,
  });
}

describe('TargetContextOperationExecutor', () => {
  it('事件来源写入 Context 时保留实体身份，不替换成宿主或敌人', () => {
    const executor = new TargetContextOperationExecutor('caster', terminal);
    const targetContext = new RuntimeTargetContext();
    executor.execute(
      {
        kind: 'mergeContextTargets',
        parameters: {
          saveToContextKey: 'attacker',
          sources: [{ kind: 'target', target: 'eventSource' }],
        },
      },
      {
        blackboard: new ActionBlackboard(),
        targetContext,
        event: { event: 'hpChanged', payload: { sourceId: 'ability-entity:7', targetId: 'enemy' } },
      },
    );
    expect(targetContext.get('attacker')).toEqual([{ kind: 'abilityEntity', instanceId: 7 }]);
  });

  it('投射物查询保存当时的候选，后续发射不混入旧结果，重新查询覆盖旧组', () => {
    const projectiles = new ProjectileLifecycleRuntime();
    const launch = () =>
      projectiles.launch({
        finishDelaySeconds: 1,
        recycleDelaySeconds: 1,
        resolveTickDeltaSeconds: () => 1,
        finish: () => {},
        beforeReset: () => {},
      });
    const first = launch();
    const executor = new TargetContextOperationExecutor(
      'caster',
      terminal,
      undefined,
      undefined,
      undefined,
      undefined,
      () => projectiles.getUnfinishedTargets(),
    );
    const targetContext = new RuntimeTargetContext();
    const context = { blackboard: new ActionBlackboard(), targetContext };
    const query = {
      kind: 'findUnfinishedProjectileTargets' as const,
      parameters: { saveToContextKey: 'projectiles' },
    };
    expect(executor.execute(query, context)).toBe(true);
    launch();
    expect(targetContext.get('projectiles')).toEqual([first.target]);
    projectiles.advanceFrame();
    expect(targetContext.get('projectiles')).toEqual([first.target]);
    executor.execute(query, context);
    expect(targetContext.get('projectiles')).toEqual([]);
    expect(projectiles.isActive(first.target)).toBe(true);
  });

  it('技能动作 Owner 优先于外层 Buff Owner 查询一层来源', () => {
    const query = vi.fn(() => ({ kind: 'operator' as const, operatorId: 'launcher' }));
    const executor = new TargetContextOperationExecutor(
      'definition-owner',
      terminal,
      id => id,
      undefined,
      query,
    );
    const targetContext = new RuntimeTargetContext();
    executor.execute(
      {
        kind: 'mergeContextTargets',
        parameters: {
          saveToContextKey: 'source',
          sources: [{ kind: 'abilitySystemSource', owner: 'actionOwner' }],
        },
      },
      {
        blackboard: new ActionBlackboard(),
        targetContext,
        actionOwnerId: 'ability-entity:2',
        buffOwnerId: 'outer-buff-owner',
      },
    );
    expect(query).toHaveBeenCalledExactlyOnceWith('ability-entity:2');
    expect(targetContext.get('source')).toEqual([{ kind: 'operator', operatorId: 'launcher' }]);
  });
  it('SourceFinder 区分动作宿主与来源，只查一层并保留能力实体身份', () => {
    const recursive = vi.fn(() => 'operator:root');
    const query = vi.fn((id: string) =>
      id === 'ability-entity:2'
        ? { kind: 'abilityEntity' as const, instanceId: 1 }
        : { kind: 'operator' as const, operatorId: id },
    );
    const executor = new TargetContextOperationExecutor(
      'operator:root',
      terminal,
      recursive,
      undefined,
      query,
    );
    const targetContext = new RuntimeTargetContext();
    const context = {
      targetContext,
      blackboard: new ActionBlackboard(),
      buffOwnerId: 'operator:recipient',
      buffSourceId: 'ability-entity:3',
      actionSourceId: 'ability-entity:2',
    };
    for (const owner of ['actionSource', 'actionOwner'] as const) {
      executor.execute(
        {
          kind: 'mergeContextTargets',
          parameters: {
            saveToContextKey: owner,
            sources: [{ kind: 'abilitySystemSource', owner }],
          },
        },
        context,
      );
    }
    expect(targetContext.get('actionSource')).toEqual([{ kind: 'abilityEntity', instanceId: 1 }]);
    expect(targetContext.get('actionOwner')).toEqual([
      { kind: 'operator', operatorId: 'operator:recipient' },
    ]);
    expect(query.mock.calls).toEqual([['ability-entity:2'], ['operator:recipient']]);
    expect(recursive).not.toHaveBeenCalled();
    expect(context.buffSourceId).toBe('ability-entity:3');
  });

  it('未装配单层来源端口时明确失败，不能偷用递归解析器或原样返回', () => {
    const executor = new TargetContextOperationExecutor('operator', terminal);
    expect(() =>
      executor.execute(
        {
          kind: 'mergeContextTargets',
          parameters: {
            saveToContextKey: 'source',
            sources: [{ kind: 'abilitySystemSource', owner: 'actionSource' }],
          },
        },
        { targetContext: new RuntimeTargetContext(), blackboard: new ActionBlackboard() },
      ),
    ).toThrow('single-level AbilitySystem source query');
  });
  it('snapshots the controlled identity, then excludes it from lowest-health selection', () => {
    const ledgers = new Map([
      ['operator:main', vitals(100)],
      ['operator:z-lowest', vitals(500)],
      ['operator:a-near-tie', vitals(500.5)],
    ]);
    let controlledId = 'operator:main';
    const executor = new TargetContextOperationExecutor('operator:ember', terminal, id => id, {
      listOperatorIds: () => [...ledgers.keys()],
      isOperatorControlled: operatorId => operatorId === controlledId,
      resolveVitals: operatorId => ledgers.get(operatorId)!,
    });
    const targetContext = new RuntimeTargetContext();
    const context = { blackboard: new ActionBlackboard(), targetContext };

    executor.execute(
      {
        kind: 'findCharacterTeamTargets',
        parameters: {
          saveToContextKey: 'Main',
          selection: { kind: 'controlledOperator' },
        },
      },
      context,
    );
    controlledId = 'operator:z-lowest';
    executor.execute(
      {
        kind: 'findCharacterTeamTargets',
        parameters: {
          saveToContextKey: 'CureTarget',
          selection: {
            kind: 'lowestHealthRatioOperator',
            excludedContextKey: 'Main',
          },
        },
      },
      context,
    );

    expect(targetContext.get('Main')).toEqual([{ kind: 'operator', operatorId: 'operator:main' }]);
    // 0.001 内沿用文档化的稳定实例 ID 投影，不声称复现原生对象哈希。
    expect(targetContext.get('CureTarget')).toEqual([
      { kind: 'operator', operatorId: 'operator:a-near-tie' },
    ]);
    ledgers.get('operator:a-near-tie')!.heal(499.5);
    ledgers.get('operator:z-lowest')!.takeDamage(400);
    expect(targetContext.get('CureTarget')).toEqual([
      { kind: 'operator', operatorId: 'operator:a-near-tie' },
    ]);
  });

  it('overwrites a previous context group with an empty query result', () => {
    const targetContext = new RuntimeTargetContext();
    targetContext.set('Saved', [{ kind: 'operator', operatorId: 'operator:old' }]);
    const executor = new TargetContextOperationExecutor('operator', terminal, id => id, {
      listOperatorIds: () => [],
      isOperatorControlled: () => false,
      resolveVitals: () => {
        throw new Error('empty query must not resolve vitals');
      },
    });
    executor.execute(
      {
        kind: 'findCharacterTeamTargets',
        parameters: {
          saveToContextKey: 'Saved',
          selection: { kind: 'lowestHealthRatioOperator' },
        },
      },
      { blackboard: new ActionBlackboard(), targetContext },
    );
    expect(targetContext.get('Saved')).toEqual([]);
  });

  it('excludes the current skill caster before choosing the lowest-health teammate', () => {
    const ledgers = new Map([
      ['operator:catcher', vitals(100)],
      ['operator:ally', vitals(500)],
    ]);
    const targetContext = new RuntimeTargetContext();
    const executor = new TargetContextOperationExecutor('operator:catcher', terminal, id => id, {
      listOperatorIds: () => [...ledgers.keys()],
      isOperatorControlled: () => false,
      resolveVitals: operatorId => ledgers.get(operatorId)!,
    });

    executor.execute(
      {
        kind: 'findCharacterTeamTargets',
        parameters: {
          saveToContextKey: 'Ally',
          selection: { kind: 'lowestHealthRatioOperator', excludeCaster: true },
        },
      },
      { blackboard: new ActionBlackboard(), targetContext },
    );

    expect(targetContext.get('Ally')).toEqual([{ kind: 'operator', operatorId: 'operator:ally' }]);
  });

  it('excludes the current forEach operator target before choosing the lowest-health teammate', () => {
    const ledgers = new Map([
      ['operator:main', vitals(100)],
      ['operator:ally', vitals(500)],
    ]);
    const targetContext = new RuntimeTargetContext();
    const executor = new TargetContextOperationExecutor(
      'operator:aura-source',
      terminal,
      id => id,
      {
        listOperatorIds: () => [...ledgers.keys()],
        isOperatorControlled: operatorId => operatorId === 'operator:main',
        resolveVitals: operatorId => ledgers.get(operatorId)!,
      },
    );
    executor.execute(
      {
        kind: 'findCharacterTeamTargets',
        parameters: {
          saveToContextKey: 'CureTarget',
          selection: { kind: 'lowestHealthRatioOperator', excludeCurrentTarget: true },
        },
      },
      {
        blackboard: new ActionBlackboard(),
        targetContext,
        currentTarget: { kind: 'operator', operatorId: 'operator:main' },
      },
    );
    expect(targetContext.get('CureTarget')).toEqual([
      { kind: 'operator', operatorId: 'operator:ally' },
    ]);
  });

  it('resolves a Buff SourceFinder group through the AbilitySystem source chain', () => {
    const executor = new TargetContextOperationExecutor('operator:holder', terminal, id =>
      id === 'ability-entity:7' ? 'operator:xaihi' : id,
    );
    const targetContext = new RuntimeTargetContext();
    executor.execute(
      {
        kind: 'mergeContextTargets',
        parameters: {
          saveToContextKey: 'seraph',
          sources: [{ kind: 'target', target: 'buffSource' }],
        },
      },
      {
        blackboard: new ActionBlackboard(),
        targetContext,
        buffSourceId: 'ability-entity:7',
      },
    );
    expect(targetContext.get('seraph')).toEqual([
      { kind: 'operator', operatorId: 'operator:xaihi' },
    ]);
  });

  it('merges the current forEach target without re-resolving its identity', () => {
    const executor = new TargetContextOperationExecutor('operator:holder', terminal);
    const targetContext = new RuntimeTargetContext();
    executor.execute(
      {
        kind: 'mergeContextTargets',
        parameters: {
          saveToContextKey: 'healTarget',
          sources: [{ kind: 'target', target: 'currentTarget' }],
        },
      },
      {
        blackboard: new ActionBlackboard(),
        targetContext,
        currentTarget: { kind: 'operator', operatorId: 'operator:controlled' },
      },
    );
    expect(targetContext.get('healTarget')).toEqual([
      { kind: 'operator', operatorId: 'operator:controlled' },
    ]);
  });

  it('initializes, merges and deduplicates event targets by stable identity', () => {
    const executor = new TargetContextOperationExecutor('operator', terminal);
    const targetContext = new RuntimeTargetContext();
    const context = {
      blackboard: new ActionBlackboard(),
      targetContext,
      event: {
        event: 'beforeTakeInfliction' as const,
        payload: {
          skillId: 'skill',
          isExtra: false,
          sourceId: 'operator',
          targetId: 'enemy',
          element: 'nature' as const,
        },
      },
    };

    executor.execute(
      { kind: 'mergeContextTargets', parameters: { saveToContextKey: 'seen', sources: [] } },
      context,
    );
    expect(
      executor.evaluate(
        { kind: 'contextTargetContains', parentContextKey: 'seen', child: 'eventTarget' },
        context,
      ),
    ).toBe(false);

    const merge = {
      kind: 'mergeContextTargets' as const,
      parameters: {
        saveToContextKey: 'seen',
        sources: [
          { kind: 'target' as const, target: 'eventTarget' as const },
          { kind: 'context' as const, contextKey: 'seen' },
        ],
      },
    };
    executor.execute(merge, context);
    executor.execute(merge, context);
    expect(targetContext.get('seen')).toEqual([{ kind: 'enemy' }]);
    expect(
      executor.evaluate(
        { kind: 'contextTargetContains', parentContextKey: 'seen', child: 'eventTarget' },
        context,
      ),
    ).toBe(true);
  });
});
