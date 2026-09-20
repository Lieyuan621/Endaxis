import { describe, expect, it } from 'vitest';
import {
  collectSkillActionReferences,
  collectSkillRootBuffReferences,
  parseKnownNativeActionSequenceSource,
  parseReferenceAwareActionLeafSource,
  type ReferenceAwareActionLeafSource,
  type SkillActionGraphSource,
} from '../src/index.ts';
import { targetFixture } from './sourceFixtures.ts';

const META = {
  isEnable: true,
  priorityLevel: 'Default',
  priorityOffset: 0,
  serverActionIndex: 1,
} as const;

describe('公共定义引用图', () => {
  it('复用公共动作分派，但只严格展开会形成定义引用的动作', () => {
    expect(
      parseReferenceAwareActionLeafSource(
        { ...META, $type: 'Example.FindTargetAction+Data, Example' },
        'fixture.find',
        {},
      ),
    ).toEqual({ family: 'untracked', nativeName: 'FindTargetAction' });
    expect(
      parseReferenceAwareActionLeafSource(
        { ...META, $type: 'Example.UnknownAction+Data, Example' },
        'fixture.unknown',
        {},
      ),
    ).toEqual({ family: 'untracked', nativeName: 'UnknownAction' });

    const malformedReference = castSkill({
      value: 'child_skill',
      useBlackboardKey: false,
      blackboardKey: '',
    });
    delete malformedReference.target;
    expect(() =>
      parseReferenceAwareActionLeafSource(malformedReference, 'fixture.cast', {}),
    ).toThrow(/fixture\.cast/);
  });

  it('ToggleBuff 忽略根附属残留，只收集条件切换和换技 Buff', () => {
    expect(
      collectSkillRootBuffReferences(
        {
          castType: 'Passive',
          passiveSkillType: 'ToggleBuff',
          buffs: [rootBuff('attached_buff')],
          toggleBuffs: [{ conditions: [{}], buffs: [rootBuff('toggle_buff')] }],
          switchToBuffConfig: {
            condition: {},
            buffs: [rootBuff('switch_buff')],
            buffSource: {},
            targets: {},
            asSkillCast: true,
          },
        },
        'fixture',
      ),
    ).toMatchObject([
      { kind: 'buff', usage: 'toggle', state: 'active', id: 'toggle_buff' },
      { kind: 'buff', usage: 'switch', state: 'active', id: 'switch_buff' },
    ]);
  });

  it('不把 AddBuff 被动中未被原生运行时读取的 toggleBuffs 残留计入闭包', () => {
    expect(
      collectSkillRootBuffReferences(
        {
          castType: 'Passive',
          passiveSkillType: 'AddBuff',
          buffs: [rootBuff('attached_buff')],
          toggleBuffs: [{ conditions: [{}], buffs: [rootBuff('ignored_toggle_buff')] }],
          switchToBuffConfig: {
            condition: {},
            buffs: [],
            buffSource: {},
            targets: {},
            asSkillCast: false,
          },
        },
        'fixture',
      ),
    ).toMatchObject([{ kind: 'buff', usage: 'attached', id: 'attached_buff' }]);
  });

  it('区分活动、关闭、动态与空子技能引用，并保留动作路径', () => {
    const sequence = parseKnownNativeActionSequenceSource(
      {
        actionData: [
          castSkill({ value: 'direct_skill', useBlackboardKey: false, blackboardKey: '' }),
          castSkill({ value: '', useBlackboardKey: true, blackboardKey: 'dynamic_skill' }),
          castSkill({ value: '', useBlackboardKey: false, blackboardKey: '' }),
          {
            ...castSkill({ value: 'disabled_skill', useBlackboardKey: false, blackboardKey: '' }),
            isEnable: false,
          },
        ],
        onlyExecuteWhenSourceIsMainChar: false,
        onlyExecuteWhenSourceIsGuard: false,
      },
      'fixture.actionGroupData.timelineActions[0]._sequenceActionData',
      {},
    );
    const graph: SkillActionGraphSource<ReferenceAwareActionLeafSource> = {
      skillId: 'fixture_skill',
      level: 1,
      durationFrame: 1,
      declaredBlackboard: [],
      actionGroup: {
        timelineActions: [
          {
            startFrame: 0,
            endFrame: 1,
            sequence,
            forceSyncAnimation: {
              forceSync: false,
              montageName: '',
              targetFrame: 0,
              playbackSpeed: 1,
            },
          },
        ],
        passiveEvents: [],
      },
    };

    expect(collectSkillActionReferences(graph)).toEqual([
      expect.objectContaining({ state: 'active', id: 'direct_skill', blackboardKey: null }),
      expect.objectContaining({ state: 'dynamic', id: null, blackboardKey: 'dynamic_skill' }),
      expect.objectContaining({ state: 'empty', id: null, blackboardKey: null }),
      expect.objectContaining({ state: 'inactive', id: 'disabled_skill', blackboardKey: null }),
    ]);
    expect(collectSkillActionReferences(graph)[0]?.sourcePath).toContain('actionData[0].skillId');
  });
});

function castSkill(skillId: Record<string, unknown>): Record<string, unknown> {
  return {
    ...META,
    $type: 'Beyond.Gameplay.Core.CastSkill+Data, Gameplay.Beyond',
    caster: targetFixture('Source'),
    target: targetFixture('Target'),
    skillId,
    skipApplyCost: true,
    inheritSourceSkillCastId: true,
  };
}

function rootBuff(buffId: string): Record<string, unknown> {
  return { buffId, assignBlackboard: false, assignItems: [] };
}
