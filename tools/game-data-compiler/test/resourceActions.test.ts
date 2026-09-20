import { describe, expect, it } from 'vitest';

import {
  parseGlobalCooldownApplicationSource,
  parseResourceGainActionSource,
  parseTimedMarkerApplicationSource,
} from '../src/index.ts';
import { scalarFixture, targetFixture } from './sourceFixtures.ts';

const META = {
  $type: 'Example.Action+Data, Example',
  isEnable: true,
  priorityLevel: 'Default',
  priorityOffset: 0,
  serverActionIndex: 1,
} as const;

const RESOURCE = {
  ...META,
  costType: 'Atb',
  isPercentValue: false,
  useUspRecoverTag: false,
  uspRecoverTag: { tagId: 0 },
  ignoreUspGainScalar: false,
  atbSourceType: 'NormalAttack',
  atbGainMethod: 'Gain',
  playObtainAtbEffect: true,
  playObtainAtbAudio: false,
  costValue: scalarFixture(0, 'atb'),
  coefficient: scalarFixture(1),
  atbOnlyMainChar: false,
  source: targetFixture('Source'),
  target: targetFixture('Owner'),
};

describe('资源与计时动作公共载荷', () => {
  it.each(['Atb', 'UltimateSp'])('新版关闭技力标签时保留 %s 的原有计算与目标', costType => {
    const old = { ...RESOURCE, costType };
    expect(
      parseResourceGainActionSource(
        { ...old, useAtbGainTag: false, atbGainTag: { tagId: 0 } },
        'resource',
        {},
      ),
    ).toEqual(parseResourceGainActionSource(old, 'resource', {}));
  });

  it('关闭时不使用残留标签，开启时明确拒绝未建模消费者', () => {
    const current = { ...RESOURCE, useAtbGainTag: false, atbGainTag: { tagId: -123 } };
    expect(parseResourceGainActionSource(current, 'resource', {})).toEqual(
      parseResourceGainActionSource(RESOURCE, 'resource', {}),
    );
    expect(() =>
      parseResourceGainActionSource({ ...current, useAtbGainTag: true }, 'resource', {}),
    ).toThrow('tagged SP gain requires native consumer projection');
  });

  it.each([
    { useAtbGainTag: false },
    { atbGainTag: { tagId: 0 } },
    { useAtbGainTag: null, atbGainTag: { tagId: 0 } },
    { useAtbGainTag: false, atbGainTag: null },
    { useAtbGainTag: false, atbGainTag: { tagId: '0' } },
    { useAtbGainTag: false, atbGainTag: { tagId: 0, extra: true } },
  ])('不吞掉缺失字段或非法标签 %j', fields => {
    expect(() =>
      parseResourceGainActionSource({ ...RESOURCE, ...fields }, 'resource', {}),
    ).toThrow();
  });

  it('完整保留资源获得动作的目标与表现开关', () => {
    const source = parseResourceGainActionSource(RESOURCE, 'fixture.resource', { atb: [3, 4] });
    expect(source).toMatchObject({
      kind: 'resourceGain',
      resource: 'sp',
      spGainKind: 'gain',
      spGainSource: 'normalAttack',
      playEffect: true,
      playAudio: false,
      amount: { blackboardKey: 'atb', levelValues: [3, 4] },
      source: { targetSource: 'Source' },
      target: { targetSource: 'Owner' },
    });
  });

  it('来源 IR 保留动态 TimedMarker ID 和局部时间选择', () => {
    const source = parseTimedMarkerApplicationSource(
      {
        ...META,
        targetSettings: targetFixture('Owner'),
        markerId: { useBlackboardKey: true, value: 'fallback', blackboardKey: 'marker_id' },
        duration: scalarFixture(2, 'marker_duration'),
        autoFinishByAction: true,
        useTimeDilationDt: true,
      },
      'fixture.marker',
      { marker_duration: [2, 3] },
    );
    expect(source).toMatchObject({
      marker: { value: 'fallback', blackboardKey: 'marker_id' },
      duration: { blackboardKey: 'marker_duration', levelValues: [2, 3] },
      autoFinishByAction: true,
      useTimeDilationDeltaTime: true,
    });
  });

  it('全局冷却以 Buff ID 保留稳定身份', () => {
    expect(
      parseGlobalCooldownApplicationSource(
        {
          ...META,
          target: targetFixture('Owner'),
          buffId: 'buff_chr_fixture_cooldown',
          cdTime: scalarFixture(0, 'cooldown'),
        },
        'fixture.cooldown',
        { cooldown: [8] },
      ),
    ).toMatchObject({
      kind: 'globalCooldownApplication',
      buffId: 'buff_chr_fixture_cooldown',
      duration: { blackboardKey: 'cooldown', levelValues: [8] },
    });
  });
});
