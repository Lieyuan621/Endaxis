import { describe, expect, it } from 'vitest';
import { parseEffectActionSource } from '../src/source/presentationActions.ts';
import { targetFixture } from './sourceFixtures.ts';

function effect(): Record<string, unknown> {
  return {
    $type: 'Beyond.Gameplay.Core.EffectAction+EffectActionData, Gameplay.Beyond',
    isEnable: true,
    priorityLevel: 'Default',
    priorityOffset: 0,
    serverActionIndex: 1,
    targetSettings: targetFixture('Target'),
    effectSource: targetFixture('Source'),
    useGuardLodSourceOverride: false,
    guardLodSource: targetFixture('Source'),
    isMainCharacterActive: false,
    isTargetMainCharacterActive: false,
    isShowBigEffect: false,
    bigEffectName: '',
    playOnHittableObjects: false,
    effectActionCfg: { effectName: 'fixture_effect' },
    saveEffectIdToBlackboard: '',
    forceMainBody: false,
    isCreateWithSourceModelActive: false,
  };
}

describe('EffectAction 新版大特效目标', () => {
  it('专用层数特效槽与多态动作共用解析结果，不伪造类型标记', () => {
    const current: Record<string, unknown> = {
      ...effect(),
      bigEffectTarget: targetFixture('Target'),
    };
    const { $type, ...typedSlot } = current;
    expect(parseEffectActionSource(typedSlot, 'effect', 'typedSlot')).toEqual(
      parseEffectActionSource(current, 'effect'),
    );
    expect(() => parseEffectActionSource(typedSlot, 'effect')).toThrow('unexpected fields');
    expect(() => parseEffectActionSource(current, 'effect', 'typedSlot')).toThrow(
      'unexpected fields',
    );
  });

  it('专用槽同样拒绝句柄写回和非法新字段', () => {
    const { $type, ...typedSlot } = effect();
    expect(() =>
      parseEffectActionSource(
        { ...typedSlot, saveEffectIdToBlackboard: 'handle' },
        'effect',
        'typedSlot',
      ),
    ).toThrow('effect handle consumers require explicit projection');
    expect(() =>
      parseEffectActionSource({ ...typedSlot, bigEffectTarget: null }, 'effect', 'typedSlot'),
    ).toThrow('effect.bigEffectTarget');
  });

  it.each([false, true])('显示开关 %s 不改变无渲染投影', isShowBigEffect => {
    const old = { ...effect(), isShowBigEffect };
    expect(
      parseEffectActionSource({ ...old, bigEffectTarget: targetFixture('Target') }, 'effect'),
    ).toEqual(parseEffectActionSource(old, 'effect'));
  });

  it.each([null, undefined, 0, {}, { ...targetFixture('Target'), extra: true }])(
    '不吞掉显式非法目标 %j',
    bigEffectTarget => {
      expect(() => parseEffectActionSource({ ...effect(), bigEffectTarget }, 'effect')).toThrow(
        'effect.bigEffectTarget',
      );
    },
  );

  it('禁止未经消费者分析就省略特效句柄写回', () => {
    for (const current of [effect(), { ...effect(), bigEffectTarget: targetFixture('Target') }]) {
      expect(() =>
        parseEffectActionSource({ ...current, saveEffectIdToBlackboard: 'handle' }, 'effect'),
      ).toThrow('effect handle consumers require explicit projection');
    }
  });

  it('继续拒绝未知行为字段', () => {
    expect(() => parseEffectActionSource({ ...effect(), onEffectEnd: {} }, 'effect')).toThrow(
      'unexpected fields',
    );
  });
});
