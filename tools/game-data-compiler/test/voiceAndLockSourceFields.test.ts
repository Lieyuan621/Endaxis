import { describe, expect, it } from 'vitest';
import {
  parseVoiceTriggerActionSource,
  parseTemporaryUnlockActionSource,
} from '../src/source/presentationActions.ts';
import { parseKnownNativeActionSequenceSource } from '../src/source/actionLeaf.ts';
import { compileCombatActionSequenceSource } from '../src/compiler/buffs/buffRuntimeProjection.ts';
import type { CombatActionProjectionContextSource } from '../src/compiler/combatProjectionCommon.ts';
import {
  createActionGraphBuilder,
  readActionGraphChain,
} from '../src/compiler/actions/actionGraphBuilder.ts';
import type { CompiledBuffStepSource } from '../src/compiler/actions/combatActionProjectionTypes.ts';

/** 图编译包装：返回入口同层动作数组，保持旧断言的扁平比较形状。 */
function projectSequence(
  source: Parameters<typeof compileCombatActionSequenceSource>[0],
  context: Omit<CombatActionProjectionContextSource, 'graph'>,
) {
  const builder = createActionGraphBuilder<CompiledBuffStepSource>();
  const entry = compileCombatActionSequenceSource(source, { ...context, graph: builder });
  return { steps: readActionGraphChain(builder.finish(), entry) };
}
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
  it('非零语音播放偏移不进入战斗调度', () => {
    const current = {
      ...voice,
      _jumpToWhenPlayMs: 250,
      _seekFadeInMs: 250,
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
      projectSequence(source, {
        actionOwnerTarget: 'caster',
        actionSourceTarget: 'caster',
        actionTargetTarget: 'enemy',
      }),
    ).toEqual({ steps: [] });
  });

  it('启用手动锁定开关仍沿用无相机省略', () => {
    expect(
      parseTemporaryUnlockActionSource({ ...unlock, blockManualLock: true }, 'unlock'),
    ).toEqual(parseTemporaryUnlockActionSource(unlock, 'unlock'));
  });

  it('非空语音句柄写回仍需分析消费者', () => {
    expect(() =>
      parseVoiceTriggerActionSource({ ...voice, _responseQuestIdKey: 'voice_id' }, 'voice'),
    ).toThrow('voice handle consumers require explicit projection');
  });

  it('原生 VoSpeakerType 数值仍是纯表现输入', () => {
    expect(parseVoiceTriggerActionSource({ ...voice, _speakerType: 4 }, 'voice')).toEqual({
      kind: 'voiceTrigger',
    });
  });

  it('拒绝越界及非整数的语音角色', () => {
    for (const speakerType of [5, 0.5]) {
      expect(() =>
        parseVoiceTriggerActionSource({ ...voice, _speakerType: speakerType }, 'voice'),
      ).toThrow('voice._speakerType');
    }
  });

  it('两个语音偏移字段都拒绝非法整数', () => {
    expect(() =>
      parseVoiceTriggerActionSource({ ...voice, _jumpToWhenPlayMs: '0' }, 'voice'),
    ).toThrow('voice._jumpToWhenPlayMs');
    expect(() => parseVoiceTriggerActionSource({ ...voice, _seekFadeInMs: null }, 'voice')).toThrow(
      'voice._seekFadeInMs',
    );
  });

  it('锁定开关拒绝字符串布尔值', () => {
    expect(() =>
      parseTemporaryUnlockActionSource({ ...unlock, blockManualLock: 'false' }, 'unlock'),
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
