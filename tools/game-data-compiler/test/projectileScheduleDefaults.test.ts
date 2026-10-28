import type { ProjectileCallbackSchedule } from '../../../packages/game-data-contract/src/projectileSchedule.ts';
import { expect, it } from 'vitest';
import {
  configuredProjectileSchedule,
  shouldOmitProjectileLaunch,
} from '../scripts/projectileScheduleDefaults.ts';
import { projectileSchedulePresets } from '../config/projectileSchedulePresets.ts';
import { resolveProjectileScheduleConfiguration } from '../src/compiler/abilities/projectileScheduleConfiguration.ts';

it('具体发射覆盖优先于预设，Buff 来源同样能使用预设', () => {
  const launch = { projectileId: 'projectile_chr_0027_tangtang_attack1', serverActionIndex: 6 };
  expect(
    configuredProjectileSchedule(launch, 'SkillData.chr_0027_tangtang_attack1.action', ['hit']),
  ).toMatchObject({
    callbacks: [{ event: 'hit', triggerFrames: [2] }],
  });
  expect(
    configuredProjectileSchedule(launch, 'BuffData.fixture.action', ['hit'])?.callbacks,
  ).toEqual([{ event: 'hit', triggerFrames: [2] }]);
  expect(
    configuredProjectileSchedule(
      { ...launch, projectileId: 'unknown' },
      'BuffData.fixture.action',
      ['hit'],
    ),
  ).toBeUndefined();
});

it('同一投射物的实体起点与施放者起点使用各自的时间表', () => {
  const projectileId = 'projectile_chr_0011_seraph_combo_skill';
  const resolve = (serverActionIndex: number) =>
    configuredProjectileSchedule(
      { projectileId, serverActionIndex },
      'SkillData.chr_0011_seraph_combo_skill.action',
      ['hit'],
    );
  expect(resolve(17)?.callbacks).toEqual([{ event: 'hit', triggerFrames: [4] }]);
  expect(resolve(21)?.callbacks).toEqual([{ event: 'hit', triggerFrames: [3] }]);
});

it('落地和超时不重复触发，预设覆盖不到的新增事件明确报出', () => {
  const launch = { projectileId: 'projectile_chr_0027_tangtang_water', serverActionIndex: 0 };
  expect(
    configuredProjectileSchedule(launch, 'SkillData.fixture.action', ['block', 'finish'])
      ?.callbacks,
  ).toEqual([
    { event: 'block', triggerFrames: [18] },
    { event: 'finish', triggerFrames: [] },
  ]);
  expect(() => configuredProjectileSchedule(launch, 'SkillData.fixture.action', ['reach'])).toThrow(
    'missing configured projectile event',
  );
});

it('全部手填预设的触发帧有序且不晚于结束帧', () => {
  for (const [id, preset] of Object.entries(projectileSchedulePresets)) {
    const eventTypes: ProjectileCallbackSchedule['event'][] = [
      'launch',
      'hit',
      'block',
      'reach',
      'finish',
    ];
    const events = eventTypes.filter(event => preset.callbacks[event] !== undefined);
    const schedule = configuredProjectileSchedule(
      { projectileId: id, serverActionIndex: 0 },
      'BuffData.fixture.action',
      events,
    )!;
    expect(
      () => resolveProjectileScheduleConfiguration(new Map([[id, { schedule }]]), id),
      id,
    ).not.toThrow();
  }
});

it('显式裁剪只作用于所列资源的无回调发射，不影响同资源的有效回调', () => {
  const projectileId = 'projectile_chr_0035_liino_plunging_attack';
  expect(shouldOmitProjectileLaunch({ projectileId, callbacks: [] })).toBe(true);
  expect(
    shouldOmitProjectileLaunch({
      projectileId,
      callbacks: [{ event: 'reach', enabled: true, skillId: 'landing' }],
    }),
  ).toBe(false);
  expect(shouldOmitProjectileLaunch({ projectileId: 'unknown', callbacks: [] })).toBe(false);
});
