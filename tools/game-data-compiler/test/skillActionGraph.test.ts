import { describe, expect, it } from 'vitest';

import { nativeActionName, parseSkillActionGroupSource } from '../src/index.ts';
import { parseSkillActionGraphSource } from '../src/source/skillActionGraph.ts';
import { activeSkillFixture } from './sourceFixtures.ts';

const META = {
  $type: 'Example.PresentationAction+Data, Example',
  isEnable: true,
  priorityLevel: 'Default',
  priorityOffset: 0,
  serverActionIndex: 1,
} as const;

describe('SkillData 动作图切片', () => {
  const parse = (source: unknown) => parseSkillActionGraphSource(source, 'fixture', {}, () => null);

  it.each([false, true])(
    '保留 VFS 根字段事实（canCastInWater=%s），不改变动作图',
    canCastInWater => {
      const source = activeSkillFixture();
      const old = parse(source);
      expect(parse({ ...source, buffInputBase: null, canCastInWater })).toEqual({
        ...old,
        buffInputBase: null,
        canCastInWater,
      });
      expect(old).not.toHaveProperty('buffInputBase');
      expect(old).not.toHaveProperty('canCastInWater');
    },
  );

  it.each([{}, { buffId: 'unknown' }, [], 0, undefined])(
    '拒绝未取证的 BuffInputBase %s',
    buffInputBase => {
      expect(() => parse({ ...activeSkillFixture(), buffInputBase })).toThrow(
        'fixture.buffInputBase',
      );
    },
  );

  it.each([null, 0, 'false', undefined])('水中配置只接受原生布尔值，拒绝 %s', canCastInWater => {
    expect(() => parse({ ...activeSkillFixture(), canCastInWater })).toThrow(
      'fixture.canCastInWater',
    );
  });

  it('已知可选字段不能掩盖未知字段和缺失必需字段', () => {
    const source = { ...activeSkillFixture(), buffInputBase: null, canCastInWater: false };
    expect(() => parse({ ...source, futureGameplayFlag: true })).toThrow('unexpected fields');
    const incomplete: Record<string, unknown> = { ...source };
    delete incomplete.actionGroupData;
    expect(() => parse(incomplete)).toThrow('unexpected fields');
  });

  it('保留时间轴区间、强制动画同步和多个被动事件序列', () => {
    const parsed = parseSkillActionGroupSource(
      {
        timelineActions: [
          {
            _startFrame: 3,
            _endFrame: 8,
            _sequenceActionData: sequence([META]),
            forceSyncAnimData: {
              forceSync: true,
              montageName: 'NormalSkill',
              targetFrame: 6,
              playbackSpeed: 1.25,
            },
          },
        ],
        passiveEventActions: [
          {
            abilityEvent: 'OnTakeDamage',
            actions: [sequence([META]), sequence([])],
          },
        ],
      },
      'fixture.actionGroupData',
      {},
      value => nativeActionName((value as { $type: string }).$type),
    );
    expect(parsed).toMatchObject({
      timelineActions: [
        {
          startFrame: 3,
          endFrame: 8,
          forceSyncAnimation: {
            forceSync: true,
            montageName: 'NormalSkill',
            targetFrame: 6,
            playbackSpeed: 1.25,
          },
          sequence: { actions: [{ body: { value: 'PresentationAction' } }] },
        },
      ],
      passiveEvents: [
        { abilityEvent: 'OnTakeDamage', actions: [{ actions: [{}] }, { actions: [] }] },
      ],
    });
  });
});

function sequence(actionData: unknown[]): Record<string, unknown> {
  return {
    actionData,
    onlyExecuteWhenSourceIsMainChar: false,
    onlyExecuteWhenSourceIsGuard: false,
  };
}
