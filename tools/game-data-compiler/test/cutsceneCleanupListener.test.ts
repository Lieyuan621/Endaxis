import { describe, expect, it } from 'vitest';
import { parseInterruptHenshinTagListenerActionSource } from '../src/source/presentationActions.ts';
import {
  ownerSpawnedAbilityEntityFindTargetActionFixture,
  scalarFixture,
  targetFixture,
} from './sourceFixtures.ts';

function fixture(buffId: string, group: string, entityTag: number) {
  const meta = {
    $type: 'Example.Action+Data, Example',
    isEnable: true,
    priorityLevel: 'Default',
    priorityOffset: 0,
    serverActionIndex: 1,
  };
  const selector = {
    finderData: {
      $type: 'Example.Selector+OwnerSpawnedEntityFinder+Data, Example',
      spawnedObjectType: 'AbilityEntity',
    },
    validatorData: [
      {
        $type: 'Example.Selector+TagValidator+Data, Example',
        query: { queryType: 'HasAny', tags: [{ tagId: entityTag }] },
      },
    ],
    postProcessorData: [],
  };
  const finish = {
    ...meta,
    buffOwner: targetFixture('Context', undefined, group),
    buffSettings: {
      checkType: 'Id',
      buffIdList: [buffId],
      tagQuery: { queryType: 'HasAny', tags: [] },
    },
    finishAll: true,
    finishLayerCnt: scalarFixture(1),
    limitSource: false,
    buffSource: targetFixture('Source'),
    isFinishedEarly: false,
    isAbsorbed: false,
    finishSource: targetFixture('Source'),
  };
  const action = {
    ...meta,
    listenerType: 'CustomQuery',
    predefinedQuery: 'None',
    executeOnMatch: true,
    customQuery: { queryType: 'HasAny', tags: [{ tagId: 1105446346 }, { tagId: 507365453 }] },
    executeAction: {
      onlyExecuteWhenSourceIsMainChar: false,
      onlyExecuteWhenSourceIsGuard: false,
      actionData: [
        {
          ...ownerSpawnedAbilityEntityFindTargetActionFixture(),
          targetGroupKey: group,
          selectorData: {
            finderData: { $type: 'Example.Selector+InFightEnemyFinder+Data, Example' },
            validatorData: [],
            postProcessorData: [],
          },
        },
        finish,
        { ...meta, owner: targetFixture('InstantSearch', selector), skipDieDisplay: false },
      ],
    },
  };
  return { action, finish };
}

describe('Arcane 过场清理的已验证边界', () => {
  it('接受已验证的封印和分身清理', () => {
    expect(
      parseInterruptHenshinTagListenerActionSource(
        fixture('buff_chr_0032_lizhiyan_combo_skill_seal', 'tar', -1480463572).action,
        'fixture',
        {},
      ),
    ).toEqual({ kind: 'cutsceneCleanupListenerOmitted' });
  });
  it.each([
    ['buff:custom', 'tar', -1480463572],
    ['buff_chr_0032_lizhiyan_combo_skill_seal', 'other', -1480463572],
    ['buff_chr_0032_lizhiyan_combo_skill_seal', 'tar', 123],
  ] as const)('拒绝未经验证的同结构样本：%s / %s / %s', (buffId, group, tag) => {
    expect(() =>
      parseInterruptHenshinTagListenerActionSource(
        fixture(buffId, group, tag).action,
        'fixture',
        {},
      ),
    ).toThrow('unsupported cutscene');
  });
  it('仍拒绝能在战斗中触发的查询和未找到的目标组', () => {
    const first = fixture('buff:custom', 'enemies', 123);
    first.action.customQuery.tags[0]!.tagId = 99;
    expect(() => parseInterruptHenshinTagListenerActionSource(first.action, 'fixture', {})).toThrow(
      'unsupported custom TagQueryListener',
    );
    const second = fixture('buff_chr_0032_lizhiyan_combo_skill_seal', 'tar', -1480463572);
    second.finish.buffOwner.targetGroupKey = 'unrelated';
    expect(() =>
      parseInterruptHenshinTagListenerActionSource(second.action, 'fixture', {}),
    ).toThrow('unsupported cutscene Buff cleanup');
  });
});
