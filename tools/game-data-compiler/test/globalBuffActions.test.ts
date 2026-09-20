import { describe, expect, it } from 'vitest';
import { parseFinishGlobalBuffActionSource } from '../src/source/globalBuffActions.ts';

// 1.4.4 TypeToken 0x2003373：globalBuffIds 是 List<GlobalBuffId>，不是字符串数组。
// 实际载荷见 buff_cc_chr_no_lastcombo_stop_atb_recover 的 FinishGlobalBuffAction。
function finishAction(globalBuffIds: unknown[]) {
  return {
    $type: 'Beyond.Gameplay.Core.AbilityActions.FinishGlobalBuffAction+Data, Gameplay.Beyond',
    isEnable: true,
    priorityLevel: 'Default',
    priorityOffset: 0,
    serverActionIndex: 3,
    finishParent: false,
    globalBuffIds,
    finishAll: true,
    finishCount: { useBlackboardKey: false, value: 1, blackboardKey: '' },
    isFinishedEarly: false,
  };
}

describe('GlobalBuff 结束动作来源', () => {
  it('读取原生 ID 包装并保留原有顺序', () => {
    expect(
      parseFinishGlobalBuffActionSource(
        finishAction([
          { id: 'global_buff_cc_chr_atb_recoverspeed_down' },
          { id: 'global_buff_combo_trigger' },
        ]),
        'action',
        {},
      ),
    ).toMatchObject({
      globalBuffIds: ['global_buff_cc_chr_atb_recoverspeed_down', 'global_buff_combo_trigger'],
    });
  });

  it('仍允许父实例路径的空列表', () => {
    expect(
      parseFinishGlobalBuffActionSource(
        {
          ...finishAction([]),
          finishParent: true,
        },
        'action',
        {},
      ),
    ).toMatchObject({ finishParent: true, globalBuffIds: [] });
  });

  it.each(['global_buff_combo_trigger', { id: '' }, { id: 'global_buff_combo_trigger', extra: 1 }])(
    '拒绝错误包装、空 ID 或未知字段：%j',
    entry => {
      expect(() => parseFinishGlobalBuffActionSource(finishAction([entry]), 'action', {})).toThrow(
        'action.globalBuffIds[0]',
      );
    },
  );
});
