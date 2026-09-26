import { describe, expect, it } from 'vitest';
import type { ActionGraphNode } from '../../../packages/game-data-contract/src/actionGraph';
import type { SkillDefinition } from '../../../packages/game-data-contract/src/skills';
import {
  addGraphNode,
  addSkillTimelineSchedule,
  duplicateSkillTimelineSchedule,
  editGraphEntries,
  getEditableGraph,
  listGraphEntryGroups,
  listGraphPorts,
  moveSkillTimelineSchedule,
  removeGraphNode,
  removeSkillTimelineSchedule,
  replaceGraphNodeAction,
  setGraphConnection,
} from './actionGraphEditing';

const main = { kind: 'main' } as const;
const macro = { kind: 'macro', macroId: 'shared' } as const;
const hit = { kind: 'dealStagger', parameters: { value: 2 } } as const;

it('结束时间线没有继续出口，也不能通过编辑命令接出后续动作', () => {
  const skill = fixture();
  const node: ActionGraphNode = { action: { kind: 'finishTimeline', parameters: {} }, next: null };
  const changed = {
    ...skill,
    actionGraph: {
      ...skill.actionGraph,
      main: { ...skill.actionGraph.main, nodes: { ...skill.actionGraph.main.nodes, finish: node } },
    },
  };
  expect(listGraphPorts(node)).toEqual([]);
  expect(() => setGraphConnection(changed, main, 'finish', ['next'], 'a')).toThrow(
    'has no control port',
  );
});

function fixture(): SkillDefinition {
  return {
    key: 'editable',
    skillType: 'basicAttack',
    levelSource: 'basicAttack',
    timelineBlockFrames: 30,
    scheduledSequences: [{ startFrame: 0, sequence: { $sequence: 'a' } }],
    switchToBuffCast: { currentSkillTypes: ['basicAttack'], sequence: { $sequence: 'a' } },
    actionGraph: {
      main: {
        nodes: {
          a: {
            action: { kind: 'repeatEachTick', parameters: {}, body: { $sequence: 'b' } },
            next: 'b',
          },
          b: { action: hit, next: null },
          macro: { action: { kind: 'callMacro', macroId: 'shared' }, next: null },
          external: {
            action: {
              kind: 'callResource',
              resource: {
                id: 'other-resource',
                entry: { $sequence: 'a' },
                actionGraph: { main: { nodes: { a: { action: hit, next: null } } }, macros: {} },
              },
            },
            next: null,
          },
        },
      },
      macros: {
        shared: { entry: { $sequence: 'a' }, graph: { nodes: { a: { action: hit, next: null } } } },
      },
    },
  };
}

describe('正式动作图编辑', () => {
  it.each([null, 'b'])('分支保留外层序列的继续出口：%s', next => {
    const node: ActionGraphNode = {
      action: {
        kind: 'conditional',
        parameters: { condition: { kind: 'constant', value: true } },
        whenTrue: { $sequence: 'b' },
      },
      next,
    };
    expect(listGraphPorts(node).map(port => [port.path, port.target])).toEqual([
      [['next'], next],
      [['action', 'whenTrue', '$sequence'], 'b'],
      [['action', 'whenFalse', '$sequence'], null],
    ]);
  });
  it('投影真实控制端口，资源入口和宏身份映射不成为本图出口', () => {
    const skill = fixture();
    expect(listGraphPorts(skill.actionGraph.main.nodes.a!)).toEqual([
      { path: ['next'], label: 'next', target: 'b' },
      { path: ['action', 'body', '$sequence'], label: 'body', target: 'b' },
    ]);
    expect(listGraphPorts(skill.actionGraph.main.nodes.external!)).toEqual([
      { path: ['next'], label: 'next', target: null },
    ]);
    const callWithIdentityNamedLikeReference: ActionGraphNode = {
      action: { kind: 'callMacro', macroId: 'shared', nodeBindings: { $sequence: 'original' } },
      next: null,
    };
    expect(listGraphPorts(callWithIdentityNamedLikeReference)).toHaveLength(1);
    expect(getEditableGraph(skill, macro)).toBe(skill.actionGraph.macros.shared!.graph);
    expect(() => getEditableGraph(skill, { kind: 'macro', macroId: 'toString' })).toThrow(
      'has no macro',
    );
  });

  it('允许多入边与显式空分支，拒绝悬空边、回边和非控制路径', () => {
    const skill = fixture();
    const connected = setGraphConnection(skill, main, 'macro', ['next'], 'b');
    expect(connected.actionGraph.main.nodes.macro!.next).toBe('b');
    expect(connected.actionGraph.main.nodes.a).toBe(skill.actionGraph.main.nodes.a);
    expect(skill.actionGraph.main.nodes.macro!.next).toBeNull();
    const disconnected = setGraphConnection(
      connected,
      main,
      'a',
      ['action', 'body', '$sequence'],
      null,
    );
    expect(listGraphPorts(disconnected.actionGraph.main.nodes.a!)[1]!.target).toBeNull();
    expect(() => setGraphConnection(skill, main, 'b', ['next'], 'a')).toThrow(
      'recursive action graph',
    );
    expect(() => setGraphConnection(skill, main, 'a', ['next'], 'missing')).toThrow(
      'missing action graph node',
    );
    expect(() => setGraphConnection(skill, main, 'a', ['next'], 'toString')).toThrow(
      'missing action graph node',
    );
    expect(() =>
      setGraphConnection(skill, main, 'b', ['action', 'parameters', 'value'], 'a'),
    ).toThrow('no control port');
    expect(() =>
      setGraphConnection(
        skill,
        main,
        'external',
        ['action', 'resource', 'entry', '$sequence'],
        'b',
      ),
    ).toThrow('no control port');
  });

  it('替换动作经过正式类型、参数与图引用校验，宏内同名节点独立修改', () => {
    const skill = fixture();
    const changed = replaceGraphNodeAction(skill, macro, 'a', {
      kind: 'dealStagger',
      parameters: { value: 7 },
    });
    expect(changed.actionGraph.main).toBe(skill.actionGraph.main);
    expect(changed.actionGraph.macros.shared!.graph.nodes.a!.action).toMatchObject({
      parameters: { value: 7 },
    });
    expect(skill.actionGraph.macros.shared!.graph.nodes.a!.action).toBe(hit);
    for (const action of [
      { kind: 'not-a-real-action', parameters: {} },
      { kind: 'dealStagger', parameters: { value: 'bad-value' } },
      { kind: 'repeatEachTick', parameters: {}, body: { $sequence: 'missing' } },
    ])
      expect(() => replaceGraphNodeAction(skill, main, 'b', action)).toThrow();
  });

  it('删除主图节点原子清空本资源入口，保留宏和独立资源内同名身份', () => {
    const skill = fixture();
    const deletedEntry = removeGraphNode(skill, main, 'a');
    expect(Object.hasOwn(deletedEntry.actionGraph.main.nodes, 'a')).toBe(false);
    expect(deletedEntry.scheduledSequences[0]!.sequence).toEqual({ $sequence: null });
    expect(deletedEntry.switchToBuffCast!.sequence).toEqual({ $sequence: null });
    expect(deletedEntry.actionGraph.macros).toBe(skill.actionGraph.macros);
    expect(deletedEntry.actionGraph.main.nodes.external).toBe(
      skill.actionGraph.main.nodes.external,
    );
    expect(skill.scheduledSequences[0]!.sequence).toEqual({ $sequence: 'a' });
    const deletedTarget = removeGraphNode(skill, main, 'b');
    expect(
      listGraphPorts(deletedTarget.actionGraph.main.nodes.a!).map(port => port.target),
    ).toEqual([null, null]);
  });

  it('删除宏入口只清空该宏入口；新建节点保留主图身份与入口', () => {
    const skill = fixture();
    const removed = removeGraphNode(skill, macro, 'a');
    expect(removed.actionGraph.macros.shared!.entry).toEqual({ $sequence: null });
    expect(removed.actionGraph.macros.shared!.graph.nodes).toEqual({});
    expect(removed.actionGraph.main).toBe(skill.actionGraph.main);
    expect(removed.scheduledSequences).toBe(skill.scheduledSequences);
    const added = addGraphNode(removed, macro, 'new', hit);
    expect(added.actionGraph.macros.shared!.graph.nodes.new).toEqual({ action: hit, next: null });
    expect(added.actionGraph.macros.shared!.entry).toEqual({ $sequence: null });
    expect(() => addGraphNode(skill, main, 'a', hit)).toThrow('already exists');
    expect(() => addGraphNode(skill, main, '', hit)).toThrow('must not be empty');
  });

  it('带 nodeBindings 的宏可改参数，但结构改动明确拒绝，避免损坏原动作身份', () => {
    const skill = replaceGraphNodeAction(fixture(), main, 'macro', {
      kind: 'callMacro',
      macroId: 'shared',
      nodeBindings: { a: 'original-node' },
    });
    expect(() => addGraphNode(skill, macro, 'new', hit)).toThrow('nodeBindings');
    expect(() => removeGraphNode(skill, macro, 'a')).toThrow('nodeBindings');
    expect(() =>
      replaceGraphNodeAction(skill, macro, 'a', { ...hit, parameters: { value: 9 } }),
    ).not.toThrow();
    expect(skill.actionGraph.macros.shared!.graph.nodes.a!.action).toBe(hit);
  });

  it('省略的条件 false 分支显示空端口，画布连线创建正式字段且仍拒绝任意路径', () => {
    const skill = replaceGraphNodeAction(fixture(), main, 'a', {
      kind: 'conditional',
      parameters: { condition: { kind: 'combatActive' } },
      whenTrue: { $sequence: 'b' },
    });
    const falsePath = ['action', 'whenFalse', '$sequence'];
    expect(listGraphPorts(skill.actionGraph.main.nodes.a!)).toContainEqual({
      path: falsePath,
      label: 'whenFalse',
      target: null,
    });
    const changed = setGraphConnection(skill, main, 'a', falsePath, 'b');
    expect(changed.actionGraph.main.nodes.a!.action).toMatchObject({
      whenFalse: { $sequence: 'b' },
    });
    expect(Object.hasOwn(skill.actionGraph.main.nodes.a!.action, 'whenFalse')).toBe(false);
    expect(
      listGraphPorts(changed.actionGraph.main.nodes.a!).filter(port => port.label === 'whenFalse'),
    ).toHaveLength(1);
    expect(
      setGraphConnection(changed, main, 'a', falsePath, null).actionGraph.main.nodes.a!.action,
    ).toMatchObject({ whenFalse: { $sequence: null } });
    expect(() =>
      setGraphConnection(skill, main, 'a', ['action', 'anotherBranch', '$sequence'], 'b'),
    ).toThrow('no control port');
    expect(() => setGraphConnection(skill, main, 'b', falsePath, 'a')).toThrow('no control port');
    expect(() => setGraphConnection(skill, main, 'a', falsePath, 'a')).toThrow(
      'recursive action graph',
    );
  });
});

describe('主技能调度列表编辑', () => {
  function timelineFixture(): SkillDefinition {
    const skill: SkillDefinition = {
      ...fixture(),
      scheduledSequences: [
        { startFrame: 30, endFrame: 35, sequence: { $sequence: 'a' } },
        { startFrame: 0, sequence: { $sequence: 'b' } },
        { startFrame: 10, sequence: { $sequence: null } },
      ],
    };
    Object.freeze(skill.scheduledSequences);
    return Object.freeze(skill);
  }

  it('新增空目标调度追加到配置末尾，不按开始时间排序或改变原图', () => {
    const skill = timelineFixture();
    const changed = addSkillTimelineSchedule(skill, 5);
    expect(changed.scheduledSequences.map(schedule => schedule.startFrame)).toEqual([30, 0, 10, 5]);
    expect(changed.scheduledSequences[3]).toEqual({ startFrame: 5, sequence: { $sequence: null } });
    expect(changed.scheduledSequences[0]).toBe(skill.scheduledSequences[0]);
    expect(changed.actionGraph).toBe(skill.actionGraph);
    expect(changed.switchToBuffCast).toBe(skill.switchToBuffCast);
    expect(skill.scheduledSequences).toHaveLength(3);
  });

  it('复制增加一次独立调度，紧接原调用且保留同一目标图引用', () => {
    const skill = timelineFixture();
    const changed = duplicateSkillTimelineSchedule(skill, 0);
    expect(changed.scheduledSequences).toHaveLength(4);
    expect(changed.scheduledSequences.map(schedule => schedule.startFrame)).toEqual([
      30, 30, 0, 10,
    ]);
    expect(changed.scheduledSequences[1]).toEqual(skill.scheduledSequences[0]);
    expect(changed.scheduledSequences[1]).not.toBe(skill.scheduledSequences[0]);
    expect(changed.scheduledSequences[1]!.sequence).toBe(skill.scheduledSequences[0]!.sequence);
    expect(
      changed.scheduledSequences.filter(schedule => schedule.sequence.$sequence === 'a'),
    ).toHaveLength(2);
    expect(changed.actionGraph).toBe(skill.actionGraph);
    const retimed = editGraphEntries(changed, main, ['timeline:1'], { startFrame: 31 });
    expect(retimed.scheduledSequences[0]!.startFrame).toBe(30);
    expect(retimed.scheduledSequences[1]!.startFrame).toBe(31);
    expect(skill.scheduledSequences).toHaveLength(3);
  });

  it('删除只移除一次调度，不删除目标节点，允许删除最后一项得到空时间线', () => {
    const skill = timelineFixture();
    const changed = removeSkillTimelineSchedule(skill, 0);
    expect(changed.scheduledSequences).toEqual(skill.scheduledSequences.slice(1));
    expect(changed.actionGraph).toBe(skill.actionGraph);
    expect(changed.actionGraph.main.nodes.a).toBe(skill.actionGraph.main.nodes.a);
    expect(changed.switchToBuffCast).toBe(skill.switchToBuffCast);
    const empty = removeSkillTimelineSchedule(removeSkillTimelineSchedule(changed, 0), 0);
    expect(empty.scheduledSequences).toEqual([]);
    expect(empty.actionGraph).toBe(skill.actionGraph);
    expect(skill.scheduledSequences).toHaveLength(3);
  });

  it('显式换序使用最终下标并保留其他调用的相对顺序，自移保持定义身份', () => {
    const skill = timelineFixture();
    const [first, second, third] = skill.scheduledSequences;
    const forward = moveSkillTimelineSchedule(skill, 0, 2);
    expect(forward.scheduledSequences).toEqual([second, third, first]);
    expect(forward.scheduledSequences[2]).toBe(first);
    const backward = moveSkillTimelineSchedule(skill, 2, 0);
    expect(backward.scheduledSequences).toEqual([third, first, second]);
    expect(backward.scheduledSequences[0]).toBe(third);
    expect(backward.actionGraph).toBe(skill.actionGraph);
    expect(moveSkillTimelineSchedule(skill, 1, 1)).toBe(skill);
    expect(skill.scheduledSequences).toEqual([first, second, third]);
  });

  it('拒绝非法帧和越界或非整数索引，空列表也没有可复制或移动的项', () => {
    const skill = timelineFixture();
    for (const frame of [-1, 0.5, Number.NaN, Number.POSITIVE_INFINITY])
      expect(() => addSkillTimelineSchedule(skill, frame)).toThrow('startFrame');
    for (const index of [-1, 0.5, 3, Number.NaN, Number.POSITIVE_INFINITY]) {
      expect(() => duplicateSkillTimelineSchedule(skill, index)).toThrow('index out of range');
      expect(() => removeSkillTimelineSchedule(skill, index)).toThrow('index out of range');
      expect(() => moveSkillTimelineSchedule(skill, index, 0)).toThrow('index out of range');
      expect(() => moveSkillTimelineSchedule(skill, 0, index)).toThrow('index out of range');
    }
    const empty = { ...skill, scheduledSequences: [] };
    expect(() => duplicateSkillTimelineSchedule(empty, 0)).toThrow('index out of range');
    expect(() => removeSkillTimelineSchedule(empty, 0)).toThrow('index out of range');
    expect(() => moveSkillTimelineSchedule(empty, 0, 0)).toThrow('index out of range');
    expect(() => addSkillTimelineSchedule({ ...skill, timelineBlockFrames: -1 }, 0)).toThrow(
      'timelineBlockFrames',
    );
    expect(skill.scheduledSequences).toHaveLength(3);
  });
});

describe('正式时间线与图入口编辑', () => {
  function scheduledFixture(): SkillDefinition {
    return {
      ...fixture(),
      scheduledSequences: [
        { startFrame: 0, sequence: { $sequence: null } },
        { startFrame: 5, endFrame: 10, sequence: { $sequence: 'b' } },
        { startFrame: 20, endFrame: 25, sequence: { $sequence: 'b' } },
      ],
      eventHandlers: [
        {
          key: 'hit-response',
          event: { kind: 'operatorHit' },
          scheduledSequences: [{ startFrame: 3, endFrame: 9, sequence: { $sequence: 'b' } }],
        },
        {
          key: 'heal-response',
          event: { kind: 'operatorHealed', role: 'target' },
          scheduledSequences: [{ startFrame: 3, sequence: { $sequence: null } }],
        },
      ],
    };
  }

  it('入口按正式调度路径投影，事件来源独立成组，同目标调度保留全部调用', () => {
    const skill = scheduledFixture();
    const groups = listGraphEntryGroups(skill, main);
    expect(groups.map(({ id, label }) => ({ id, label }))).toEqual([
      { id: 'timeline', label: '施放时间线' },
      { id: 'event:0', label: '事件 · hit-response' },
      { id: 'event:1', label: '事件 · heal-response' },
      { id: 'switch', label: '切换为 Buff 施放' },
    ]);
    expect(groups[0]!.entries).toEqual([
      { id: 'timeline:0', label: '调度 1', targetId: null, startFrame: 0 },
      { id: 'timeline:1', label: '调度 2', targetId: 'b', startFrame: 5, endFrame: 10 },
      { id: 'timeline:2', label: '调度 3', targetId: 'b', startFrame: 20, endFrame: 25 },
    ]);
    expect(groups[1]!.entries[0]!.id).toBe('event:0:0');
    expect(groups[2]!.entries[0]!.id).toBe('event:1:0');
    expect(groups[3]!.entries).toEqual([{ id: 'switch', label: '切换入口', targetId: 'a' }]);
    expect(listGraphEntryGroups(skill, macro)).toEqual([
      {
        id: 'macro',
        label: '宏 · shared',
        entries: [{ id: 'macro', label: '宏入口', targetId: 'a' }],
      },
    ]);
  });

  it('空时间线入口可重连，直接更新正式序列并保留图及其他来源', () => {
    const skill = scheduledFixture();
    const changed = editGraphEntries(skill, main, ['timeline:0'], { targetId: 'b' });
    expect(changed.scheduledSequences[0]).toEqual({ startFrame: 0, sequence: { $sequence: 'b' } });
    expect(changed.scheduledSequences[1]).toBe(skill.scheduledSequences[1]);
    expect(changed.eventHandlers).toBe(skill.eventHandlers);
    expect(changed.actionGraph).toBe(skill.actionGraph);
    expect(skill.scheduledSequences[0]!.sequence).toEqual({ $sequence: null });
    expect(editGraphEntries(changed, main, ['timeline:0'], { targetId: 'b' })).toBe(changed);
  });

  it('批量重接同目标时间段保持独立调用和各自帧范围，不改动事件调度', () => {
    const skill = scheduledFixture();
    const changed = editGraphEntries(skill, main, ['timeline:1', 'timeline:2'], { targetId: 'a' });
    expect(changed.scheduledSequences).toHaveLength(3);
    expect(changed.scheduledSequences.slice(1)).toEqual([
      { startFrame: 5, endFrame: 10, sequence: { $sequence: 'a' } },
      { startFrame: 20, endFrame: 25, sequence: { $sequence: 'a' } },
    ]);
    expect(changed.scheduledSequences[1]).not.toBe(changed.scheduledSequences[2]);
    expect(changed.eventHandlers).toBe(skill.eventHandlers);
  });

  it('事件入口保持触发来源，帧相对原事件修改，null 删除可选结束帧', () => {
    const skill = scheduledFixture();
    const changed = editGraphEntries(skill, main, ['event:0:0'], {
      targetId: 'a',
      startFrame: 6,
      endFrame: null,
    });
    expect(changed.eventHandlers![0]!.event).toBe(skill.eventHandlers![0]!.event);
    expect(changed.eventHandlers![0]!.key).toBe('hit-response');
    expect(changed.eventHandlers![0]!.scheduledSequences).toEqual([
      { startFrame: 6, sequence: { $sequence: 'a' } },
    ]);
    expect(Object.hasOwn(changed.eventHandlers![0]!.scheduledSequences[0]!, 'endFrame')).toBe(
      false,
    );
    expect(changed.eventHandlers![1]).toBe(skill.eventHandlers![1]);
    expect(changed.scheduledSequences).toBe(skill.scheduledSequences);
    expect(skill.eventHandlers![0]!.scheduledSequences[0]!.endFrame).toBe(9);
  });

  it('宏与切换入口可断开再连接，宏只能指向自身图且不接受帧编辑', () => {
    const skill = scheduledFixture();
    const disconnected = editGraphEntries(skill, macro, ['macro'], { targetId: null });
    expect(disconnected.actionGraph.macros.shared!.entry.$sequence).toBeNull();
    const reconnected = editGraphEntries(disconnected, macro, ['macro'], { targetId: 'a' });
    expect(reconnected.actionGraph.macros.shared!.entry.$sequence).toBe('a');
    expect(reconnected.actionGraph.main).toBe(skill.actionGraph.main);
    expect(reconnected.scheduledSequences).toBe(skill.scheduledSequences);
    expect(() => editGraphEntries(skill, macro, ['macro'], { targetId: 'b' })).toThrow(
      'missing action graph node',
    );
    expect(() => editGraphEntries(skill, macro, ['timeline:0'], { targetId: 'a' })).toThrow(
      'has no entry',
    );
    expect(() => editGraphEntries(skill, main, ['macro'], { targetId: 'a' })).toThrow(
      'has no entry',
    );
    expect(() => editGraphEntries(skill, macro, ['macro'], { startFrame: 0 })).toThrow(
      'does not have a time range',
    );
    expect(() => editGraphEntries(skill, main, ['switch'], { endFrame: null })).toThrow(
      'does not have a time range',
    );
    const switched = editGraphEntries(skill, main, ['switch'], { targetId: null });
    expect(switched.switchToBuffCast!.sequence.$sequence).toBeNull();
    expect(
      editGraphEntries(switched, main, ['switch'], { targetId: 'b' }).switchToBuffCast!.sequence
        .$sequence,
    ).toBe('b');
  });

  it('非法时间与悬空目标原子拒绝，批量编辑任一项倒置都不改变原定义', () => {
    const skill = scheduledFixture();
    for (const patch of [
      { startFrame: -1 },
      { startFrame: 0.5 },
      { endFrame: Number.NaN },
      { endFrame: -1 },
    ])
      expect(() => editGraphEntries(skill, main, ['timeline:1'], patch)).toThrow(
        'non-negative integer',
      );
    expect(() => editGraphEntries(skill, main, ['timeline:1'], { startFrame: 11 })).toThrow(
      'must not be less than startFrame',
    );
    expect(() =>
      editGraphEntries(skill, main, ['timeline:1', 'timeline:2'], { endFrame: 15 }),
    ).toThrow('must not be less than startFrame');
    expect(() => editGraphEntries(skill, main, ['timeline:0'], { targetId: 'missing' })).toThrow(
      'missing action graph node',
    );
    expect(() => editGraphEntries(skill, main, ['timeline:01'], { targetId: 'a' })).toThrow(
      'has no entry',
    );
    expect(skill.scheduledSequences[1]!.endFrame).toBe(10);
    expect(skill.scheduledSequences[2]!.endFrame).toBe(25);
  });

  it('入口更改仍校验整个正式技能与图资源，不忽略另一张宏图的非法引用', () => {
    const skill = scheduledFixture();
    const invalid: SkillDefinition = {
      ...skill,
      actionGraph: {
        ...skill.actionGraph,
        macros: {
          shared: {
            entry: { $sequence: 'a' },
            graph: { nodes: { a: { action: hit, next: 'missing' } } },
          },
        },
      },
    };
    expect(() => editGraphEntries(invalid, main, ['timeline:0'], { targetId: 'b' })).toThrow(
      'missing action graph node',
    );
    expect(() =>
      editGraphEntries({ ...skill, timelineBlockFrames: -1 }, main, ['timeline:0'], {
        targetId: 'b',
      }),
    ).toThrow('timelineBlockFrames');
  });
});
