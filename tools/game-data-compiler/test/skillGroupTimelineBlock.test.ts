import { describe, expect, it } from 'vitest';
import {
  selectBasicAttackTimelineBlockFrames,
  selectSingleSkillTimelineBlockFrames,
} from '../src/domains/operator/definition.ts';
import type { CompiledOperatorActiveSkillRuntimeDefinitionSource } from '../src/domains/operator/activeSkillRuntimeDefinition.ts';

function skill(
  skillId: string,
  transitions: CompiledOperatorActiveSkillRuntimeDefinitionSource['allowNextSkillTransitions'],
): CompiledOperatorActiveSkillRuntimeDefinitionSource {
  return {
    key: skillId,
    blackboard: {},
    timelineBlockFrames: 0,
    naturalDurationFrames: 40,
    exclusiveFrame: 40,
    offsetRecordFrame: 0,
    costFrame: 0,
    scheduledSequences: [],
    allowNextSkillTransitions: transitions,
  };
}

describe('基础攻击技能块窗口', () => {
  it('显式显示参照覆盖默认连段宽度，即便参照窗口更晚', () => {
    const definitions = new Map([
      [
        'attack',
        {
          ...skill('attack', [
            { startFrame: 10, endFrame: 30, skillIds: ['next'], direct: true },
            { startFrame: 25, endFrame: 30, skillIds: ['battle'], direct: true },
          ]),
          timelineBlockFrames: 10,
          timelineBlockFollowUpSkillId: 'battle',
        },
      ],
      ['next', skill('next', [])],
      ['battle', skill('battle', [])],
    ]);
    selectSingleSkillTimelineBlockFrames(
      definitions,
      [
        { skillType: 'basicAttack', skillKeys: ['attack', 'next'], replacementPlacements: {} },
        { skillType: 'battleSkill', skillKeys: ['battle'], replacementPlacements: {} },
      ],
      new Set(),
    );
    expect(definitions.get('attack')?.timelineBlockFrames).toBe(25);
  });
  it('按有序下一段筛选窗口，不被跳段和条件快捷退出压成 0 帧', () => {
    const definitions = new Map([
      [
        'native_attack1',
        skill('native_attack1', [
          { startFrame: 16, endFrame: 30, skillIds: ['native_attack2'], direct: true },
          { startFrame: 0, endFrame: 10, skillIds: ['native_attack5'], direct: true },
        ]),
      ],
      [
        'native_attack2',
        skill('native_attack2', [
          { startFrame: 24, endFrame: 36, skillIds: ['native_attack1'], direct: true },
          { startFrame: 0, endFrame: 8, skillIds: ['native_attack1'], direct: false },
        ]),
      ],
    ]);

    selectBasicAttackTimelineBlockFrames(definitions, [
      {
        skillType: 'basicAttack',
        skillKeys: ['native_attack1', 'native_attack2'],
        variants: [],
      },
    ]);

    expect(definitions.get('native_attack1')?.timelineBlockFrames).toBe(16);
    expect(definitions.get('native_attack2')?.timelineBlockFrames).toBe(24);
    expect(definitions.get('native_attack1')?.timelineContinuationSkillId).toBe('native_attack2');
    expect(definitions.get('native_attack2')?.timelineContinuationSkillId).toBe('native_attack1');
    expect(definitions.get('native_attack2')?.inputWindows?.allowedNextSkills).toEqual([
      { startFrame: 24, endFrame: 36, skillIds: ['native_attack1'] },
    ]);
  });

  it('同一顶层目标存在立即退出和稍后续段时采用最早的正数连段窗口', () => {
    const definitions = new Map([
      [
        'native_attack1',
        skill('native_attack1', [
          { startFrame: 0, endFrame: 8, skillIds: ['native_attack2'], direct: true },
          {
            startFrame: 16,
            endFrame: 30,
            skillIds: ['native_attack1', 'native_attack2'],
            direct: true,
          },
        ]),
      ],
      ['native_attack2', skill('native_attack2', [])],
    ]);

    selectBasicAttackTimelineBlockFrames(definitions, [
      {
        skillType: 'basicAttack',
        skillKeys: ['native_attack1', 'native_attack2'],
        variants: [],
      },
    ]);

    expect(definitions.get('native_attack1')?.timelineBlockFrames).toBe(16);
    expect(definitions.get('native_attack1')?.timelineContinuationSkillId).toBe('native_attack2');
  });

  it('同一下一段存在多轮输入窗口时采用第一次可输入的窗口', () => {
    const definitions = new Map([
      [
        'native_attack1',
        skill('native_attack1', [
          { startFrame: 18, endFrame: 25, skillIds: ['native_attack2'], direct: false },
          { startFrame: 63, endFrame: 70, skillIds: ['native_attack2'], direct: false },
          { startFrame: 93, endFrame: 100, skillIds: ['native_attack2'], direct: false },
          { startFrame: 123, endFrame: 130, skillIds: ['native_attack2'], direct: false },
          { startFrame: 153, endFrame: 160, skillIds: ['native_attack2'], direct: false },
        ]),
      ],
      ['native_attack2', skill('native_attack2', [])],
    ]);

    selectBasicAttackTimelineBlockFrames(definitions, [
      {
        skillType: 'basicAttack',
        skillKeys: ['native_attack1', 'native_attack2'],
        variants: [],
      },
    ]);

    expect(definitions.get('native_attack1')?.timelineBlockFrames).toBe(18);
    expect(definitions.get('native_attack1')?.timelineContinuationSkillId).toBe('native_attack2');
    expect(definitions.get('native_attack1')?.inputWindows?.allowedNextSkills).toEqual([
      { startFrame: 18, endFrame: 25, skillIds: ['native_attack2'] },
      { startFrame: 63, endFrame: 70, skillIds: ['native_attack2'] },
      { startFrame: 93, endFrame: 100, skillIds: ['native_attack2'] },
      { startFrame: 123, endFrame: 130, skillIds: ['native_attack2'] },
      { startFrame: 153, endFrame: 160, skillIds: ['native_attack2'] },
    ]);
  });
});

describe('单技能入口的预览宽度', () => {
  it('连携序列和战技的提前窗口不再缩短非普攻块宽', () => {
    const definitions = new Map([
      [
        'native.first',
        {
          ...skill('native.first', [
            { startFrame: 37, endFrame: 65, skillIds: ['native.second'], direct: true },
          ]),
          timelineBlockFrames: 66,
        },
      ],
      [
        'native.second',
        {
          ...skill('native.second', [
            { startFrame: 52, endFrame: 72, skillIds: ['native.battle'], direct: true },
            { startFrame: 249, endFrame: 269, skillIds: ['native.battle'], direct: true },
          ]),
          timelineBlockFrames: 260,
        },
      ],
      ['native.battle', skill('native.battle', [])],
    ]);

    selectSingleSkillTimelineBlockFrames(
      definitions,
      [
        {
          skillType: 'comboSkill',
          skillKeys: ['native.first', 'native.second'],
          replacementPlacements: { 'native.second': 'sequence' },
        },
        { skillType: 'battleSkill', skillKeys: ['native.battle'], replacementPlacements: {} },
      ],
      new Set(['native.second']),
    );

    expect(definitions.get('native.first')?.timelineBlockFrames).toBe(66);
    expect(definitions.get('native.second')?.timelineBlockFrames).toBe(260);
  });

  it('使用可操作的直接接续，不把内部回调或条件分支当成玩家输入', () => {
    const definitions = new Map([
      [
        'native.stance',
        {
          ...skill('native.stance', [
            { startFrame: 5, endFrame: 20, skillIds: ['native.internal'], direct: true },
            { startFrame: 10, endFrame: 20, skillIds: ['native.stop'], direct: false },
            { startFrame: 50, endFrame: 100, skillIds: ['native.stop'], direct: true },
          ]),
          timelineBlockFrames: 1800,
          naturalDurationFrames: 2100,
          exclusiveFrame: 1799,
        },
      ],
      ['native.internal', skill('native.internal', [])],
      ['native.stop', skill('native.stop', [])],
    ]);

    selectSingleSkillTimelineBlockFrames(
      definitions,
      [
        {
          skillType: 'battleSkill',
          skillKeys: ['native.stance', 'native.internal', 'native.stop'],
          replacementPlacements: { 'native.internal': 'internal', 'native.stop': 'standard' },
        },
      ],
      new Set(['native.internal', 'native.stop']),
    );

    expect(definitions.get('native.stance')?.timelineBlockFrames).toBe(1800);
    expect(definitions.get('native.stance')?.exclusiveFrame).toBe(1799);
    expect(definitions.get('native.internal')?.timelineBlockFrames).toBe(0);
    definitions.set('native.stance', {
      ...definitions.get('native.stance')!,
      timelineBlockFollowUpSkillId: 'native.stop',
    });
    const groups = [
      {
        skillType: 'battleSkill' as const,
        skillKeys: ['native.stance', 'native.internal', 'native.stop'],
        replacementPlacements: {
          'native.internal': 'internal' as const,
          'native.stop': 'standard' as const,
        },
      },
    ];
    selectSingleSkillTimelineBlockFrames(
      definitions,
      groups,
      new Set(['native.internal', 'native.stop']),
    );
    expect(definitions.get('native.stance')?.timelineBlockFrames).toBe(50);
    definitions.set('native.stance', {
      ...definitions.get('native.stance')!,
      timelineBlockFollowUpSkillId: 'native.internal',
    });
    expect(() =>
      selectSingleSkillTimelineBlockFrames(
        definitions,
        groups,
        new Set(['native.internal', 'native.stop']),
      ),
    ).toThrow('routable native continuation');
  });

  it('没有可路由窗口时，独立可放置技能使用原生无条件结束点', () => {
    const definitions = new Map([
      ['native.base', skill('native.base', [])],
      [
        'native.floating',
        {
          ...skill('native.floating', []),
          timelineBlockFrames: 1000,
          scheduledSequences: [
            {
              startFrame: 180,
              endFrame: 181,
              sequence: { steps: [{ kind: 'finishTimeline' as const, parameters: {} }] },
            },
          ],
        },
      ],
    ]);

    selectSingleSkillTimelineBlockFrames(
      definitions,
      [
        {
          skillType: 'comboSkill',
          skillKeys: ['native.base', 'native.floating'],
          replacementPlacements: { 'native.floating': 'standard' },
        },
      ],
      new Set(['native.floating']),
    );

    expect(definitions.get('native.floating')?.timelineBlockFrames).toBe(180);
  });
});
