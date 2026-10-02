import { describe, expect, it } from 'vitest';
import {
  detectRuntimeEnvironment,
  type RuntimeEnvironmentSignals,
} from '../../platform/runtimeEnvironment';
import { resolveTimelineLayout } from './timelineLayoutPolicy';

const linuxUA = 'Mozilla/5.0 (X11; Linux x86_64) Chrome/140 Safari/537.36';
const chromeOSUA = 'Mozilla/5.0 (X11; CrOS x86_64 14541.0.0) Chrome/140 Safari/537.36';
const androidUA = 'Mozilla/5.0 (Linux; Android 10; K) Chrome/140 Mobile Safari/537.36';
const touch = { width: 980, coarsePointer: true, maxTouchPoints: 5 };
const cases: [string, RuntimeEnvironmentSignals, 'mobile' | 'desktop'][] = [
  ['Android phone', { ...touch, userAgent: androidUA }, 'mobile'],
  [
    'Android tablet without Mobile token',
    { ...touch, userAgent: androidUA.replace(' Mobile', ''), userAgentData: { mobile: false } },
    'mobile',
  ],
  [
    'Android with an attached mouse',
    { width: 980, userAgent: androidUA, finePointer: true },
    'mobile',
  ],
  [
    'desktop Linux UA with touch',
    { ...touch, userAgent: linuxUA, userAgentData: { mobile: false } },
    'desktop',
  ],
  ['desktop CrOS UA with touch', { ...touch, userAgent: chromeOSUA }, 'desktop'],
  ['desktop mode in narrow landscape', { ...touch, width: 740, userAgent: linuxUA }, 'desktop'],
  [
    'mobile hint contradicts desktop UA',
    { ...touch, userAgent: linuxUA, userAgentData: { mobile: true } },
    'mobile',
  ],
  [
    'Windows touchscreen preserves touch layout',
    { ...touch, userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' },
    'mobile',
  ],
  [
    'Windows mouse preserves desktop layout',
    { width: 980, userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)', finePointer: true },
    'desktop',
  ],
  [
    'iPhone',
    { ...touch, userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X)' },
    'mobile',
  ],
  [
    'iPad desktop identity even with a mouse',
    {
      width: 980,
      userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15)',
      platform: 'MacIntel',
      maxTouchPoints: 5,
      finePointer: true,
    },
    'mobile',
  ],
  [
    'Mac without touch',
    {
      width: 980,
      userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15)',
      platform: 'MacIntel',
      finePointer: true,
    },
    'desktop',
  ],
  ['unknown coarse pointer fallback', touch, 'mobile'],
  [
    'touch capability alone is not layout intent',
    { width: 980, maxTouchPoints: 5, finePointer: true },
    'desktop',
  ],
  [
    'mobile hint alone can declare mobile',
    { width: 980, userAgentData: { mobile: true } },
    'mobile',
  ],
  ['1366 boundary remains mobile', { ...touch, width: 1366, userAgent: androidUA }, 'mobile'],
  ['wide browser uses desktop', { ...touch, width: 1367, userAgent: androidUA }, 'desktop'],
  [
    'native host overrides wide desktop identity',
    { ...touch, width: 1920, userAgent: `${linuxUA} EndaxisApp/1.0` },
    'mobile',
  ],
];

describe('timeline layout policy', () => {
  it.each(cases)('%s', (_name, signals, expected) => {
    expect(resolveTimelineLayout(detectRuntimeEnvironment(signals))).toBe(expected);
  });
});
