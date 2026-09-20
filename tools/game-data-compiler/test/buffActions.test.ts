import { describe, expect, it } from 'vitest';

import {
  parseAdvancedBuffFinishActionSource,
  parseBuffApplicationActionSource,
  parseLegacyBuffFinishActionSource,
} from '../src/index.ts';
import { scalarFixture, targetFixture } from './sourceFixtures.ts';

const META = {
  $type: 'Example.Action+Data, Example',
  isEnable: true,
  priorityLevel: 'Default',
  priorityOffset: 0,
  serverActionIndex: 1,
} as const;

const SOURCE_TARGET = targetFixture('Source');

describe('Buff 动作公共载荷', () => {
  it.each(['ActionSource', 0])('施加动作保留间接黑板赋值和生命周期字段：%s', buffSource => {
    const source = parseBuffApplicationActionSource(
      {
        ...META,
        buffs: [
          {
            buffId: 'buff_chr_fixture',
            assignBlackboard: true,
            assignItems: [
              {
                targetKey: 'duration',
                inputValueKey: 'buff_duration',
                useDirectValue: false,
                directValueType: typeof buffSource === 'number' ? 0 : 'Numeric',
                numericValue: 3,
                stringValue: '',
              },
            ],
            readIdFromBlackboard: false,
            buffIdKey: '',
          },
        ],
        count: scalarFixture(1),
        targetSettings: targetFixture('Target'),
        buffSource,
        contextKey: '',
        autoFinishByAction: true,
        inheritSkillIdList: ['chr_fixture_followup'],
        finishWithNextSkillIfNotInherited: true,
        asChildBuff: false,
        inheritSourceSkillCastId: true,
        inheritSourceSkillCastInfo: true,
        isExtra: false,
        passTargetGroupsToBuff: false,
        overrideBuffIconDuration: true,
        buffIconDurationSource: typeof buffSource === 'number' ? {
          durationSourceType: 0,
          timedMarkerId: '',
        } : {
          m_abilityEntityTypeInfo: 'editor hint',
          m_timedMarkerInfo: 'editor hint',
          durationSourceType: 'AbilityEntity',
          timedMarkerId: '',
        },
      },
      'fixture.createBuff',
      {},
    );
    expect(source).toMatchObject({
      kind: 'buffApplication',
      buffSource: 'ActionSource',
      lifetimeOwner: 'independent',
      buffs: [
        {
          buffId: 'buff_chr_fixture',
          assignments: [
            {
              targetKey: 'duration',
              useDirectValue: false,
              inputValueKey: 'buff_duration',
              numericValue: 3,
            },
          ],
        },
      ],
      autoFinishByAction: true,
      inheritSkillIds: ['chr_fixture_followup'],
      inheritSourceSkillCastId: true,
      overrideBuffIconDuration: true,
      buffIconDuration: { durationSourceType: 'AbilityEntity', timedMarkerId: '' },
    });
  });

  it('高级结束动作保留查询、来源与减层值', () => {
    const source = parseAdvancedBuffFinishActionSource(
      {
        ...META,
        buffOwner: targetFixture('Target'),
        buffSettings: {
          checkType: 'Tag',
          buffIdList: [''],
          tagQuery: { queryType: 'HasAny', tags: [{ tagId: -1480463572 }] },
        },
        finishAll: false,
        finishLayerCnt: scalarFixture(0, 'finish_count'),
        limitSource: true,
        buffSource: SOURCE_TARGET,
        isFinishedEarly: true,
        isAbsorbed: false,
        finishSource: SOURCE_TARGET,
      },
      'fixture.finishBuffAdvanced',
      { finish_count: [1, 2] },
    );
    expect(source).toMatchObject({
      kind: 'buffFinishByQuery',
      settings: {
        checkType: 'Tag',
        buffIds: [''],
        tagQuery: { queryType: 'hasAny', tagIds: [-1480463572] },
      },
      finishAll: false,
      finishLayerCount: { blackboardKey: 'finish_count', levelValues: [1, 2] },
      limitSource: true,
      isAbsorbed: false,
    });
  });

  it('旧式结束动作保留完整目标引用和 ID 数组', () => {
    expect(
      parseLegacyBuffFinishActionSource(
        {
          ...META,
          buffOwner: targetFixture('Target'),
          buffIds: [{ buffId: 'buff_chr_fixture' }],
          finishAll: true,
          finishLayerCnt: scalarFixture(1),
          limitSource: false,
          buffSource: SOURCE_TARGET,
          isFinishedEarly: false,
          finishSource: SOURCE_TARGET,
        },
        'fixture.finishBuff',
        {},
      ),
    ).toMatchObject({
      kind: 'buffFinishById',
      buffIds: ['buff_chr_fixture'],
      owner: { targetSource: 'Target' },
      buffSource: { targetSource: 'Source' },
      finishSource: { targetSource: 'Source' },
    });
  });
});
