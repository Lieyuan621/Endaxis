import { expect, it } from 'vitest';
import { createSSRApp, h } from 'vue';
import { createI18n } from 'vue-i18n';
import { renderToString } from 'vue/server-renderer';
import { mountSetup } from '../../test/componentSetup';
import GameOverlayHud from './GameOverlayHud.vue';
import type { OverlayCast, OverlayPlan } from './plan';
import { DEFAULT_OVERLAY_PREFERENCES } from './preferences';
import { findNextCastGroup } from './layout';

function plan(): OverlayPlan {
  const cast: OverlayCast = {
    id: 'cast',
    trackId: 'track',
    trackIndex: 0,
    operatorSlug: 'operator',
    operatorName: '干员',
    avatar: '/avatar.webp',
    portrait: '/portrait.webp',
    skillIcon: '/skill.webp',
    name: '战技',
    type: 'battleSkill',
    element: 'physical',
    start: 10,
    end: 11,
    spCost: null,
    gaugeCost: 0,
    segments: 1,
  };
  return {
    casts: [cast],
    tracks: [{ ...cast }],
    startTime: -3,
    duration: 11,
    maxSp: 300,
    initialSp: 20,
    spPoints: [{ time: 1, value: 5 }],
    gaugePoints: {
      track: [
        { time: -3, value: 20 },
        { time: 5, value: 79.9 },
        { time: 6, value: 80 },
        { time: 6, value: 0 },
      ],
    },
    gaugeMaxValues: { track: 80 },
    comboWindows: {},
    hasCasts: true,
  };
}

it('uses the actual energy capacity and samples resource changes at their timestamp', async () => {
  const source = plan();
  source.comboWindows = { track: [{ start: -3, end: 5 }] };
  const partial = { ...source, gaugePoints: { track: [{ time: -3, value: 20 }] } };
  const hud = await mountSetup(GameOverlayHud, {
    plan: partial,
    preferences: DEFAULT_OVERLAY_PREFERENCES,
    now: -3,
    isPlaying: false,
  });
  try {
    expect(hud.state.gaugeChips.value[0]).toMatchObject({ ratio: 0.25, ready: false });
    expect(hud.state.spValue.value).toBe(20);
    expect(hud.state.comboState.value.remaining).toBe(8);
    await hud.update({ plan: source, now: 5 });
    expect(hud.state.comboState.value).toBeNull();
    expect(hud.state.gaugeChips.value[0].ready).toBe(false);
    expect(hud.state.spValue.value).toBe(5);
    await hud.update({ now: 6 });
    expect(hud.state.gaugeChips.value[0]).toMatchObject({ ratio: 0, ready: false });
    const full = { ...source, gaugePoints: { track: [{ time: -3, value: 80 }] } };
    await hud.update({ plan: full });
    expect(hud.state.gaugeChips.value[0]).toMatchObject({ ratio: 1, ready: true });
    await hud.update({ plan: { ...full, gaugeMaxValues: {} } });
    expect(hud.state.gaugeChips.value[0]).toMatchObject({ ratio: 0, ready: false });
  } finally {
    hud.stop();
  }
});

it('shows insufficient SP only for a known cost and retries icons after a plan reload', async () => {
  const source = plan();
  const hud = await mountSetup(GameOverlayHud, {
    plan: source,
    preferences: DEFAULT_OVERLAY_PREFERENCES,
    now: -3,
    isPlaying: false,
  });
  try {
    expect(hud.state.nextSpCost.value).toBeNull();
    expect(hud.state.spShort.value).toBe(false);
    await hud.update({ plan: { ...source, casts: [{ ...source.casts[0]!, spCost: 50 }] } });
    expect(hud.state.nextSpCost.value).toBe(50);
    expect(hud.state.spShort.value).toBe(true);
    const cast = source.casts[0]!;
    hud.state.markIconFailed({ target: { getAttribute: () => cast.skillIcon } });
    expect(hud.state.iconOf(cast)).toBe(cast.avatar);
    await hud.update({ preferences: { ...DEFAULT_OVERLAY_PREFERENCES, iconMode: 'portrait' } });
    expect(hud.state.iconOf(cast)).toBe(cast.portrait);
    await hud.update({ plan: source, preferences: DEFAULT_OVERLAY_PREFERENCES });
    expect(hud.state.iconOf(cast)).toBe(cast.skillIcon);
  } finally {
    hud.stop();
  }
});

it('renders simultaneous next inputs, their overflow and the playback state without grouping adjacent frames', async () => {
  const source = plan();
  const first = { ...source.casts[0]!, operatorName: '一号干员', name: 'battleSkill' };
  source.casts = [
    first,
    { ...first, id: 'second', operatorName: '二号干员', type: 'comboSkill', name: '接续' },
    { ...first, id: 'third', operatorName: '三号干员', type: 'ultimate', name: '终结' },
    { ...first, id: 'adjacent', operatorName: '邻帧动作', start: 10 + 1 / 60 },
    { ...first, id: 'last', operatorName: '已过期操作', start: 11, end: 11 },
  ];
  async function render(now: number, isPlaying = false, finished = false) {
    const app = createSSRApp({
      render: () =>
        h(GameOverlayHud, {
          plan: source,
          preferences: DEFAULT_OVERLAY_PREFERENCES,
          now,
          isPlaying,
          finished,
        }),
    });
    app.use(createI18n({ legacy: false, locale: 'zh-CN', messages: { 'zh-CN': {} } }));
    return renderToString(app);
  }
  const ready = await render(-3);
  expect(ready).toContain('就绪');
  expect(ready).toContain('-0:03.0 / 0:11.0');
  const paused = await render(10);
  const pausedText = paused.replace(/<[^>]+>/g, '');
  expect(pausedText).toContain('已暂停');
  expect(pausedText).toContain('一号干员 · 战技');
  expect(pausedText).not.toContain('battleSkill');
  expect(pausedText).toContain('二号干员 · 连携技 · 接续');
  expect(pausedText).toContain('另有 1 项');
  expect(pausedText).not.toContain('三号干员');
  expect(pausedText).not.toContain('邻帧动作');
  expect(paused).not.toContain('is-urgent');
  const playing = await render(10, true);
  expect(playing).toContain('播放中');
  expect(playing).toContain('is-urgent');
  const finished = await render(11, false, true);
  expect(finished).toContain('已完成');
  expect(finished).not.toContain('已过期操作');
  expect(finished).not.toContain('is-urgent');
});

it('checks the combined SP cost of simultaneous inputs and hides an incomplete total', async () => {
  const source = plan();
  source.initialSp = 150;
  source.casts = [
    { ...source.casts[0]!, spCost: 100 },
    { ...source.casts[0]!, id: 'second', trackId: 'second', spCost: 100 },
  ];
  const hud = await mountSetup(GameOverlayHud, {
    plan: source,
    preferences: DEFAULT_OVERLAY_PREFERENCES,
    now: -3,
    isPlaying: false,
  });
  try {
    expect(hud.state.nextSpCost.value).toBe(200);
    expect(hud.state.spShort.value).toBe(true);
    await hud.update({
      plan: {
        ...source,
        casts: [source.casts[0]!, { ...source.casts[1]!, spCost: null }],
      },
    });
    expect(hud.state.nextSpCost.value).toBeNull();
    expect(hud.state.spShort.value).toBe(false);
  } finally {
    hud.stop();
  }
});

it('keeps adjacent 30 fps inputs distinct and advances through each before finishing', () => {
  const first = plan().casts[0]!;
  const casts = [
    first,
    { ...first, id: 'second', start: first.start + 1 / 30 },
    { ...first, id: 'third', start: first.start + 2 / 30 },
  ];
  expect(findNextCastGroup(casts, first.start).map(cast => cast.id)).toEqual(['cast']);
  expect(findNextCastGroup(casts, first.start + 1 / 30).map(cast => cast.id)).toEqual(['second']);
  expect(findNextCastGroup(casts, first.start + 2 / 30).map(cast => cast.id)).toEqual(['third']);
  expect(
    [0, 1, 2].map(frame =>
      findNextCastGroup(casts, first.start + (frame + 0.5) / 30).map(cast => cast.id),
    ),
  ).toEqual([['cast'], ['second'], ['third']]);
  expect(findNextCastGroup(casts, first.start + 3 / 30)).toEqual([]);
});

it('shows the separate start countdown without making the first action urgent until it ends', async () => {
  const source = plan();
  source.casts = [{ ...source.casts[0]!, start: source.startTime }];
  const hud = await mountSetup(GameOverlayHud, {
    plan: source,
    preferences: DEFAULT_OVERLAY_PREFERENCES,
    now: source.startTime,
    isPlaying: false,
    waitingRemaining: 2,
    hasStarted: false,
  });
  try {
    expect(hud.state.playbackState.value).toBe('ready');
    expect(hud.state.countdownText.value).toBe('2.0');
    expect(hud.state.typeLabel.value).toBe('等待开始');
    await hud.update({ isPlaying: true, hasStarted: true, waitingRemaining: 1.2 });
    expect(hud.state.playbackState.value).toBe('waiting');
    expect(hud.state.countdownText.value).toBe('1.2');
    expect(hud.state.countdownUrgent.value).toBe(false);
    await hud.update({ isPlaying: false });
    expect(hud.state.playbackState.value).toBe('waitingPaused');
    await hud.update({ isPlaying: true, waitingRemaining: 0 });
    expect(hud.state.playbackState.value).toBe('playing');
    expect(hud.state.typeLabel.value).toBe('战技');
    expect(hud.state.countdownUrgent.value).toBe(true);
  } finally {
    hud.stop();
  }
});
