import { describe, expect, it } from 'vitest';
import { compileAbilityEventPrograms } from '../../src/compiler/abilities/abilityEventProgram.ts';
import type { NativeSequenceSource } from '../../src/source/controlFlow.ts';

function sequence(
  id: string,
  priorityLevel = 'Default',
  priorityOffset = 0,
): NativeSequenceSource<string> {
  return {
    onlyExecuteWhenSourceIsMainCharacter: false,
    onlyExecuteWhenSourceIsGuard: false,
    actions: [
      {
        metadata: {
          nativeType: 'Game.TestAction',
          nativeName: 'TestAction',
          enabled: true,
          priorityLevel,
          priorityOffset,
          serverActionIndex: 0,
        },
        sourcePath: id,
        body: { kind: 'leaf', value: id },
      },
    ],
  };
}

describe('公共 AbilityEvent 程序投影', () => {
  it('序列编译接收同一次映射的公共事件身份，不必再次解析原始名称', () => {
    const identity = { event: 'addedBuff' };
    const seen: unknown[] = [];
    const result = compileAbilityEventPrograms(
      [{ abilityEvent: 'OnAddedBuff', actions: [sequence('a0'), sequence('a1')] }],
      {
        sourcePath: 'events',
        mapEvent: () => identity,
        compileSequence: (_sequence, path, native, projected) => {
          seen.push([path, native, projected]);
          return ['step'];
        },
        isEmptySequence: () => false,
      },
    );
    expect(seen).toEqual([
      ['events[0].actions[0]', 'OnAddedBuff', identity],
      ['events[0].actions[1]', 'OnAddedBuff', identity],
    ]);
    expect(result[0]?.event).toBe(identity);
    expect((seen[1] as unknown[])[2]).toBe(identity);
  });

  it('保留事件和同事件多条 SequenceAction 的来源注册顺序', () => {
    const compiled = compileAbilityEventPrograms(
      [
        { abilityEvent: 'A', actions: [sequence('a0'), sequence('a1')] },
        { abilityEvent: 'B', actions: [sequence('b0')] },
      ],
      {
        sourcePath: 'SkillData.test.passiveEventActions',
        mapEvent: event => `event:${event}`,
        compileSequence: source => source.actions.map(node => node.sourcePath),
        isEmptySequence: value => value.length === 0,
      },
    );

    expect(compiled).toEqual([
      {
        event: 'event:A',
        priority: 0,
        sequence: ['a0'],
        sourceEventIndex: 0,
        sourceSequenceIndex: 0,
      },
      {
        event: 'event:A',
        priority: 0,
        sequence: ['a1'],
        sourceEventIndex: 0,
        sourceSequenceIndex: 1,
      },
      {
        event: 'event:B',
        priority: 0,
        sequence: ['b0'],
        sourceEventIndex: 1,
        sourceSequenceIndex: 0,
      },
    ]);
  });

  it('未证明的原生优先级不会静默降级成零', () => {
    expect(() =>
      compileAbilityEventPrograms([{ abilityEvent: 'A', actions: [sequence('a0', 'High', 2)] }], {
        sourcePath: 'SkillData.test.passiveEventActions',
        mapEvent: event => event,
        compileSequence: () => ['step'],
        isEmptySequence: value => value.length === 0,
      }),
    ).toThrow('unsupported native action priority High + 2');
  });

  it('场景省略不改变后续程序的来源下标', () => {
    expect(() =>
      compileAbilityEventPrograms(
        [
          { abilityEvent: 'omit', actions: [sequence('a0')] },
          { abilityEvent: 'keep', actions: [sequence('b0', 'High')] },
        ],
        {
          sourcePath: 'SkillData.test.passiveEventActions',
          omitEvent: event => event === 'omit',
          mapEvent: event => event,
          compileSequence: () => ['step'],
          isEmptySequence: value => value.length === 0,
        },
      ),
    ).toThrow('passiveEventActions[1].actions[0]');
  });
});
