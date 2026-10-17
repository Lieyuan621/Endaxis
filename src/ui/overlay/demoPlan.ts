/**
 * 示例轴：用于首次启动时预览提示条（`/overlay?demo=1`），
 * 也方便在没有排好轴的情况下检查 HUD 的观感。
 *
 * 纯函数，不依赖任何外部数据，图标回退到干员头像。
 */

import type { OverlayCast, OverlayPlan, OverlaySkillType, OverlayTimePoint } from './plan';

interface DemoTrack {
  id: string;
  name: string;
  element: string;
  avatar: string;
  portrait: string;
}

const DEMO_TRACKS: DemoTrack[] = [
  {
    id: 'laevatain',
    name: '莱万汀',
    element: 'heat',
    avatar: '/operators/laevatain/avatar.webp',
    portrait: '/operators/laevatain/portrait.webp',
  },
  {
    id: 'arcane',
    name: '诀',
    element: 'nature',
    avatar: '/operators/arcane/avatar.webp',
    portrait: '/operators/arcane/portrait.webp',
  },
  {
    id: 'endministrator',
    name: '管理员',
    element: 'physical',
    avatar: '/operators/endministrator/avatar.webp',
    portrait: '/operators/endministrator/portrait.webp',
  },
];

const SKILL_NAMES: Record<OverlaySkillType, string> = {
  battleSkill: '战技',
  comboSkill: '连携技',
  ultimate: '终结技',
  basicAttack: '普攻',
  dive: '下落攻击',
  finisher: '处决',
  other: '技能',
};

/** 施放节奏：战技为主，间或连携与终结技，看起来像一条真实输出轴。 */
const DEMO_PATTERN: OverlaySkillType[] = [
  'battleSkill',
  'battleSkill',
  'comboSkill',
  'battleSkill',
  'ultimate',
  'battleSkill',
  'comboSkill',
  'battleSkill',
];

export function buildDemoPlan(durationSeconds = 64): OverlayPlan {
  const casts: OverlayCast[] = [];
  const comboWindows: Record<string, Array<{ start: number; end: number }>> = {};
  const gaugePoints: Record<string, OverlayTimePoint[]> = {};

  const step = 2.4;
  let time = 5; // 与默认准备时间一致，开局不会立刻有动作
  let index = 0;

  while (time < durationSeconds - 2) {
    const track = DEMO_TRACKS[index % DEMO_TRACKS.length]!;
    const type = DEMO_PATTERN[index % DEMO_PATTERN.length]!;
    const castDuration = type === 'ultimate' ? 2.6 : type === 'comboSkill' ? 1.2 : 1.6;

    casts.push({
      id: `demo-${index}`,
      trackId: track.id,
      trackIndex: index % DEMO_TRACKS.length,
      operatorSlug: track.id,
      operatorName: track.name,
      avatar: track.avatar,
      portrait: track.portrait,
      skillIcon: '',
      name: SKILL_NAMES[type],
      type,
      element: track.element,
      start: Number(time.toFixed(2)),
      end: Number((time + castDuration).toFixed(2)),
      spCost: type === 'battleSkill' ? 100 : 0,
      gaugeCost: type === 'ultimate' ? 100 : 0,
      segments: 1,
    });

    if (type === 'comboSkill') {
      const windows = comboWindows[track.id] ?? [];
      windows.push({ start: Number((time - 1.5).toFixed(2)), end: Number((time + 3.2).toFixed(2)) });
      comboWindows[track.id] = windows;
    }

    index += 1;
    time += step + (index % 3) * 0.4;
  }

  // 技力：战技消耗、平时回复，形成锯齿
  const spPoints: OverlayTimePoint[] = [{ time: 0, value: 200 }];
  let sp = 200;
  for (const cast of casts) {
    sp = Math.max(0, sp - cast.spCost);
    spPoints.push({ time: cast.start, value: sp });
    const regenUntil = Math.min(durationSeconds, cast.start + step);
    for (let t = cast.start + 0.5; t < regenUntil; t += 0.5) {
      sp = Math.min(280, sp + 6);
      spPoints.push({ time: Number(t.toFixed(2)), value: sp });
    }
  }

  // 终结技能量：每个干员缓慢充能，放完归零
  for (const track of DEMO_TRACKS) {
    const points: OverlayTimePoint[] = [{ time: 0, value: 0 }];
    let gauge = 0;
    for (const cast of casts.filter(item => item.trackId === track.id)) {
      gauge = Math.min(100, gauge + (cast.start * 4.2) % 100);
      points.push({ time: cast.start, value: Math.round(gauge) });
      if (cast.type === 'ultimate') {
        gauge = 0;
        points.push({ time: cast.start + 0.2, value: 0 });
      }
    }
    points.push({ time: durationSeconds, value: Math.round(gauge) });
    gaugePoints[track.id] = points.sort((left, right) => left.time - right.time);
  }

  return {
    casts,
    tracks: DEMO_TRACKS.map((track, trackIndex) => ({
      trackId: track.id,
      trackIndex,
      operatorSlug: track.id,
      operatorName: track.name,
      avatar: track.avatar,
      portrait: track.portrait,
      element: track.element,
    })),
    duration: casts.length ? casts[casts.length - 1]!.end + 2 : durationSeconds,
    maxSp: 300,
    initialSp: 200,
    spPoints,
    gaugePoints,
    comboWindows,
    hasCasts: casts.length > 0,
  };
}
