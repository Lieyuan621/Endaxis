import { describe, expect, it } from 'vitest';
import {
  parseVoiceTriggerActionSource,
  parseTemporaryUnlockActionSource,
} from '../src/source/presentationActions.ts';
import { parseKnownNativeActionSequenceSource } from '../src/source/actionLeaf.ts';
import { compileCombatActionSequenceSource } from '../src/compiler/buffs/buffRuntimeProjection.ts';
import { targetFixture } from './sourceFixtures.ts';

const meta = { isEnable: true, priorityLevel: 'Default', priorityOffset: 0, serverActionIndex: 1 };
const voice = {
  ...meta,
  $type: 'Beyond.Gameplay.Core.VoiceTriggerAction+Data, Gameplay.Beyond',
  _triggerKey: 'battle',
  _speakerType: 'Owner',
  _canInterruptTimeMs: 0,
  targetSettings: targetFixture('Owner'),
};
const unlock = {
  ...meta,
  $type: 'Beyond.Gameplay.Core.TemporaryUnlockAction+Data, Gameplay.Beyond',
  compareTarget: false,
  targetSettings: targetFixture('Target'),
  disableLockAimPriority: 30,
};

describe('语音与镜头锁定的新版字段', () => {
  it.each([0, 250])('语音播放偏移 %s 不进入战斗调度', offset => {
    const current = {
      ...voice,
      _jumpToWhenPlayMs: offset,
      _seekFadeInMs: offset,
      _responseQuestIdKey: '',
    };
    expect(parseVoiceTriggerActionSource(current, 'voice')).toEqual(
      parseVoiceTriggerActionSource(voice, 'voice'),
    );
    const source = parseKnownNativeActionSequenceSource(
      {
        onlyExecuteWhenSourceIsMainChar: false,
        onlyExecuteWhenSourceIsGuard: false,
        actionData: [current, { ...unlock, blockManualLock: true }],
      },
      'sequence',
      {},
    );
    expect(
      compileCombatActionSequenceSource(source, {
        actionOwnerTarget: 'caster',
        actionSourceTarget: 'caster',
        actionTargetTarget: 'enemy',
      }),
    ).toEqual({ steps: [] });
  });

  it.each([false, true])('手动锁定开关 %s 沿用无相机省略', blockManualLock => {
    expect(parseTemporaryUnlockActionSource({ ...unlock, blockManualLock }, 'unlock')).toEqual(
      parseTemporaryUnlockActionSource(unlock, 'unlock'),
    );
  });

  it('非空语音句柄写回仍需分析消费者', () => {
    expect(() =>
      parseVoiceTriggerActionSource({ ...voice, _responseQuestIdKey: 'voice_id' }, 'voice'),
    ).toThrow('voice handle consumers require explicit projection');
  });

  it.each([0, 1, 2, 3, 4])('VFS 原生 VoSpeakerType 数值 %s 仍是纯表现输入', speakerType => {
    expect(parseVoiceTriggerActionSource({ ...voice, _speakerType: speakerType }, 'voice')).toEqual(
      { kind: 'voiceTrigger' },
    );
  });

  it.each([-1, 5, 0.5, null, {}])('拒绝未知 VoSpeakerType %j', speakerType => {
    expect(() =>
      parseVoiceTriggerActionSource({ ...voice, _speakerType: speakerType }, 'voice'),
    ).toThrow('voice._speakerType');
  });

  it.each([null, undefined, '0', {}, 0.5])('语音偏移拒绝非法整数 %j', value => {
    for (const key of ['_jumpToWhenPlayMs', '_seekFadeInMs']) {
      expect(() => parseVoiceTriggerActionSource({ ...voice, [key]: value }, 'voice')).toThrow(
        `voice.${key}`,
      );
    }
  });

  it.each([null, undefined, 0, 'false', {}])('锁定开关拒绝非法布尔 %j', blockManualLock => {
    expect(() =>
      parseTemporaryUnlockActionSource({ ...unlock, blockManualLock }, 'unlock'),
    ).toThrow('unlock.blockManualLock');
  });

  it('不放开未知行为字段', () => {
    expect(() => parseVoiceTriggerActionSource({ ...voice, onEnd: {} }, 'voice')).toThrow(
      'unexpected fields',
    );
    expect(() => parseTemporaryUnlockActionSource({ ...unlock, onEnd: {} }, 'unlock')).toThrow(
      'unexpected fields',
    );
  });
});
