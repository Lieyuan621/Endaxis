import { describe, expect, it } from 'vitest';
import { parseHideUiActionSource } from '../src/source/presentationActions.ts';
import { parseKnownNativeActionLeafSource } from '../src/source/actionLeaf.ts';
import { parseSkillActionGraphSource } from '../src/source/skillActionGraph.ts';
import { activeSkillFixture } from './sourceFixtures.ts';

const action = {
  $type: 'Beyond.Gameplay.Core.HideUIAction+Data, Gameplay.Beyond',
  isEnable: true,
  priorityLevel: 'Default',
  priorityOffset: 0,
  serverActionIndex: 1,
};

describe('HideUIAction source preservation', () => {
  it.each([true, false])('公共动作图保留演出区间及输入分支 %s，不扩为技能全长', onlyBlockInput => {
    // 佩丽卡 1.5.3 终结技来源：HideUI 0..52，UltimateTime 0..50，durationFrame=114。
    // 此处验证来源图，而非声称已经实现演出操作锁；true 为另一个分支的合成探针。
    const timeline = (endFrame: number, data: Record<string, unknown>) => ({
      _startFrame: 0,
      _endFrame: endFrame,
      _sequenceActionData: {
        actionData: [data],
        onlyExecuteWhenSourceIsMainChar: false,
        onlyExecuteWhenSourceIsGuard: false,
      },
      forceSyncAnimData: { forceSync: false, montageName: '', targetFrame: 0, playbackSpeed: 0 },
    });
    const parsed = parseSkillActionGraphSource(
      {
        ...activeSkillFixture(),
        durationFrame: 114,
        actionGroupData: {
          timelineActions: [
            timeline(50, {
              ...action,
              $type: 'Beyond.Gameplay.Core.UltimateTimeAction+Data, Gameplay.Beyond',
              timeScale: 0,
              timeDilationPriority: { tagId: -1742631616 },
              ignoreTargets: [],
            }),
            timeline(52, { ...action, onlyBlockInput }),
          ],
          passiveEventActions: [],
        },
      },
      'fixture',
      {},
      (value, path) => parseKnownNativeActionLeafSource(value, path, {}),
    );
    expect(parsed.durationFrame).toBe(114);
    expect(
      parsed.actionGroup.timelineActions.map(item => [item.startFrame, item.endFrame]),
    ).toEqual([
      [0, 50],
      [0, 52],
    ]);
    expect(parsed.actionGroup.timelineActions[1]?.sequence.actions[0]).toMatchObject({
      body: { value: { action: { kind: 'hideUi', onlyBlockInput } } },
    });
  });

  it.each([true, false])(
    'preserves onlyBlockInput=%s without equating the branches',
    onlyBlockInput => {
      expect(parseHideUiActionSource({ ...action, onlyBlockInput }, 'action')).toEqual({
        kind: 'hideUi',
        onlyBlockInput,
      });
    },
  );

  it.each([undefined, null, 0, 'false'])(
    'rejects missing or non-boolean flag %s',
    onlyBlockInput => {
      expect(() => parseHideUiActionSource({ ...action, onlyBlockInput }, 'action')).toThrow();
    },
  );
});
