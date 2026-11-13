import { CombatReceiptCollector } from '../receipt/combatReceipt';
import { expect, it } from 'vitest';
import { CombatClock } from '../time/combatClock';
import { OperatorControlRuntime } from './operatorControlRuntime';

it('切人通知中的条件查询始终看到完整的新主控身份', () => {
  const clock = new CombatClock();
  const seen: { owner: string; controlled: string[] }[] = [];
  const runtime = new OperatorControlRuntime({
    clock,
    state: new Map([
      ['a', true],
      ['b', false],
    ]),
    receipt: new CombatReceiptCollector(),
    readControl: (id, frame) => id === (frame === 0 ? 'a' : 'b'),
    emit: owner => {
      seen.push({
        owner,
        controlled: [...runtime.runtimeState]
          .filter(([, controlled]) => controlled)
          .map(([id]) => id),
      });
    },
  });
  clock.advanceFrame();
  runtime.advanceFrame();
  expect(seen).toEqual([
    { owner: 'a', controlled: ['b'] },
    { owner: 'b', controlled: ['b'] },
  ]);
});

it('自动切人只记录实际变化，空帧保留身份，手动切人按同帧最后一项执行', () => {
  const clock = new CombatClock();
  const receipt = new CombatReceiptCollector();
  const state = new Map([
    ['a', true],
    ['b', false],
  ]);
  const options = {
    clock,
    receipt,
    state,
    configuration: {
      initialOperatorId: 'a',
      automaticSwitches: true,
      scheduledSwitches: [
        { frame: 2, operatorId: 'b' },
        { frame: 2, operatorId: 'a' },
      ],
    },
  };
  const runtime = new OperatorControlRuntime(options);
  runtime.beforeSkillInput('b', 'basicAttack', 'basicAttack', 'first');
  runtime.beforeSkillInput('b', 'basicAttack', 'basicAttack', 'second');
  expect(receipt.entries).toHaveLength(1);
  clock.advanceFrame();
  runtime.advanceFrame();
  expect(state.get('b')).toBe(true);
  // 恢复直接绑定保存的身份，不按 initialOperatorId 重新初始化，也不发回执。
  const branchState = structuredClone(state);
  const branch = new OperatorControlRuntime({ ...options, state: branchState });
  expect(branch.runtimeState.get('b')).toBe(true);
  expect(receipt.entries).toHaveLength(1);
  clock.advanceFrame();
  branch.advanceFrame();
  expect(branchState.get('a')).toBe(true);
  expect(state.get('b')).toBe(true);
  branch.beforeSkillInput('b', undefined, 'finisher', 'third');
  expect(receipt.entries.map(entry => [entry.frame, entry.data?.castId])).toEqual([
    [0, 'first'],
    [2, 'third'],
  ]);
});

it.each([
  ['basicAttack', 'battleSkill', true],
  ['battleSkill', 'basicAttack', false],
  [undefined, 'plungingAttack', true],
  [undefined, 'finisher', true],
] as const)('自动切人规则：操作=%s，技能类型=%s', (action, skillType, shouldSwitch) => {
  const receipt = new CombatReceiptCollector();
  const state = new Map([
    ['a', true],
    ['b', false],
  ]);
  const runtime = new OperatorControlRuntime({
    clock: new CombatClock(),
    receipt,
    state,
    configuration: { initialOperatorId: 'a', automaticSwitches: true, scheduledSwitches: [] },
  });
  runtime.beforeSkillInput('b', action, skillType, 'cast');
  expect(state.get('b')).toBe(shouldSwitch);
  expect(receipt.entries).toHaveLength(shouldSwitch ? 1 : 0);
});

it('实际切换时先清理双方连段再通知，重复选择和恢复不重复清理', () => {
  const trace: string[] = [];
  const options = {
    clock: new CombatClock(),
    receipt: new CombatReceiptCollector(),
    state: new Map([
      ['a', true],
      ['b', false],
    ]),
    controlChanged: (id: string) => {
      trace.push(`reset:${id}`);
    },
    emit: (id: string) => {
      trace.push(`event:${id}`);
    },
  };
  const runtime = new OperatorControlRuntime(options);
  runtime.applyInput('b');
  expect(trace).toEqual(['reset:a', 'reset:b', 'event:a', 'event:b']);
  runtime.applyInput('b');
  new OperatorControlRuntime({ ...options, state: structuredClone(runtime.runtimeState) });
  expect(trace).toHaveLength(4);
});

it.each([false, true])('原生技能切主控使用独立回执，自动切人=%s', automaticSwitches => {
  const changes: string[] = [];
  const receipt = new CombatReceiptCollector();
  const state = new Map([
    ['a', true],
    ['b', false],
  ]);
  const runtime = new OperatorControlRuntime({
    clock: new CombatClock(),
    receipt,
    state,
    configuration: { initialOperatorId: 'a', automaticSwitches, scheduledSwitches: [] },
    controlChanged: id => {
      changes.push(id);
    },
  });
  runtime.beforeSkillInput('b', 'ultimate', 'ultimate', 'ult', true);
  expect(state.get('b')).toBe(true);
  expect(changes).toEqual(['a', 'b']);
  expect(receipt.entries).toEqual([
    expect.objectContaining({
      event: 'SkillControlSwitched',
      sourceId: 'b',
      data: { castId: 'ult' },
    }),
  ]);
});
