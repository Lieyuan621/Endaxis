import { describe, expect, it, vi } from 'vitest';
import { createEmptyScenario } from '../../core/project/createProject';
import { ScenarioEditorSession } from './scenarioEditorSession';

describe('ScenarioEditorSession', () => {
  it('把一次有效命令记录为一次会话修订', () => {
    const initial = createEmptyScenario('scenario:1', '初始场景');
    const session = new ScenarioEditorSession(initial);

    expect(
      session.commit('renameScenario', scenario => ({ ...scenario, name: '修改后场景' })),
    ).toBe(true);
    expect(session.snapshot).toMatchObject({
      revision: 1,
      lastCommand: 'renameScenario',
      scenario: { name: '修改后场景' },
    });
    expect(initial.name).toBe('初始场景');
  });

  it('无变化命令不会制造历史修订或通知', () => {
    const session = new ScenarioEditorSession(createEmptyScenario('scenario:1', '场景'));
    const subscriber = vi.fn();
    session.subscribe(subscriber);

    expect(session.commit('noop', scenario => scenario)).toBe(false);
    expect(session.snapshot.revision).toBe(0);
    expect(subscriber).not.toHaveBeenCalled();
  });

  it('只通知仍处于订阅状态的消费者', () => {
    const session = new ScenarioEditorSession(createEmptyScenario('scenario:1', '场景'));
    const subscriber = vi.fn();
    const unsubscribe = session.subscribe(subscriber);

    session.commit('extendBattle', scenario => ({
      ...scenario,
      battle: { ...scenario.battle, durationFrames: 60 },
    }));
    unsubscribe();
    session.commit('extendBattleAgain', scenario => ({
      ...scenario,
      battle: { ...scenario.battle, durationFrames: 90 },
    }));

    expect(subscriber).toHaveBeenCalledTimes(1);
    expect(subscriber.mock.calls[0]?.[0].revision).toBe(1);
  });

  it('可以连续撤销和重做显式提交', () => {
    const session = new ScenarioEditorSession(createEmptyScenario('scenario:1', '初始场景'));
    session.commit('rename:first', scenario => ({ ...scenario, name: '第一次' }));
    session.commit('rename:second', scenario => ({ ...scenario, name: '第二次' }));

    expect(session.canUndo).toBe(true);
    expect(session.canRedo).toBe(false);
    expect(session.undo()).toBe(true);
    expect(session.snapshot.scenario.name).toBe('第一次');
    expect(session.undo()).toBe(true);
    expect(session.snapshot.scenario.name).toBe('初始场景');
    expect(session.undo()).toBe(false);

    expect(session.redo()).toBe(true);
    expect(session.snapshot.scenario.name).toBe('第一次');
    expect(session.redo()).toBe(true);
    expect(session.snapshot.scenario.name).toBe('第二次');
    expect(session.redo()).toBe(false);
  });

  it('撤销后产生新提交会丢弃旧的重做分支', () => {
    const session = new ScenarioEditorSession(createEmptyScenario('scenario:1', '初始场景'));
    session.commit('rename:first', scenario => ({ ...scenario, name: '第一次' }));
    session.commit('rename:second', scenario => ({ ...scenario, name: '第二次' }));
    session.undo();

    session.commit('rename:replacement', scenario => ({ ...scenario, name: '替代分支' }));

    expect(session.canRedo).toBe(false);
    expect(session.redo()).toBe(false);
    expect(session.snapshot.scenario.name).toBe('替代分支');
  });

  it('限制历史长度但保持修订号单调递增', () => {
    const session = new ScenarioEditorSession(createEmptyScenario('scenario:1', '0'), 2);
    for (const name of ['1', '2', '3']) {
      session.commit(`rename:${name}`, scenario => ({ ...scenario, name }));
    }

    expect(session.undo()).toBe(true);
    expect(session.undo()).toBe(true);
    expect(session.undo()).toBe(false);
    expect(session.snapshot).toMatchObject({
      revision: 5,
      scenario: { name: '1' },
      lastCommand: 'undo:rename:2',
    });
  });

  it('拒绝无效的历史容量', () => {
    const scenario = createEmptyScenario('scenario:1', '场景');
    expect(() => new ScenarioEditorSession(scenario, 0)).toThrow('positive integer');
    expect(() => new ScenarioEditorSession(scenario, 1.5)).toThrow('positive integer');
  });
});
