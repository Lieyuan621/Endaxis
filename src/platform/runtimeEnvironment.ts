/** 浏览器声明身份、原生壳和输入能力分别记录，不能从触摸能力推断设备或桌面网站开关。 */
export interface RuntimeEnvironmentSignals {
  readonly userAgent?: string;
  readonly platform?: string;
  readonly maxTouchPoints?: number;
  readonly userAgentData?: { readonly mobile?: boolean; readonly platform?: string };
  readonly coarsePointer?: boolean;
  readonly finePointer?: boolean;
  readonly hover?: boolean;
  readonly width?: number;
  readonly height?: number;
}

export interface RuntimeEnvironment {
  readonly host: 'browser' | 'endaxis-app';
  readonly browser: {
    readonly identity: 'mobile' | 'desktop' | 'ipad-desktop' | 'unknown';
    readonly platform: 'android' | 'ios' | 'windows' | 'macos' | 'linux' | 'chromeos' | 'unknown';
  };
  readonly input: {
    readonly touch: boolean;
    readonly primaryPointer: 'coarse' | 'fine' | 'none';
    readonly hover: boolean;
  };
  /** 布局视口的 CSS 像素，不使用屏幕物理尺寸或软键盘影响下的 visualViewport。 */
  readonly viewport: { readonly width: number; readonly height: number };
}

/** 纯分类入口；不识别真实硬件，也不声称能读取浏览器的“桌面版网站”设置。 */
export function detectRuntimeEnvironment(signals: RuntimeEnvironmentSignals): RuntimeEnvironment {
  const ua = signals.userAgent ?? '';
  const touchPoints = signals.maxTouchPoints ?? 0;
  let identity: RuntimeEnvironment['browser']['identity'] = 'unknown';
  let platform: RuntimeEnvironment['browser']['platform'] = 'unknown';
  if (/iPad|iPhone|iPod/i.test(ua)) {
    platform = 'ios';
    identity = 'mobile';
  } else if (/Android/i.test(ua)) {
    // 普通 Android 平板也可能 mobile=false，不能据此选择桌面布局。
    platform = 'android';
    identity = 'mobile';
  } else if (signals.platform === 'MacIntel' && touchPoints > 1) {
    platform = 'ios';
    identity = 'ipad-desktop';
  } else if (/\bX11\b/i.test(ua) && /\b(?:Linux|CrOS)\b/i.test(ua)) {
    // Chromium 桌面模式的 UA-CH platform 可为 Linux、Chrome OS 或 Android；以 UA 声明为准。
    platform = /\bCrOS\b/i.test(ua) ? 'chromeos' : 'linux';
    identity = signals.userAgentData?.mobile === true ? 'mobile' : 'desktop';
  } else if (/Windows/i.test(ua)) {
    platform = 'windows';
    identity = 'desktop';
  } else if (/Macintosh|Mac OS X/i.test(ua)) {
    platform = 'macos';
    identity = 'desktop';
  } else if (signals.userAgentData?.mobile === true) {
    identity = 'mobile';
  }
  return {
    host: /\bEndaxisApp\//i.test(ua) ? 'endaxis-app' : 'browser',
    browser: { identity, platform },
    input: {
      touch: touchPoints > 0,
      primaryPointer: signals.coarsePointer ? 'coarse' : signals.finePointer ? 'fine' : 'none',
      hover: signals.hover ?? false,
    },
    viewport: { width: signals.width ?? 0, height: signals.height ?? 0 },
  };
}

const INPUT_QUERIES = ['(pointer: coarse)', '(pointer: fine)', '(hover: hover)'] as const;

/** 唯一的浏览器环境读取入口。非浏览器测试/渲染使用无输入、零尺寸快照。 */
export function readRuntimeEnvironment(): RuntimeEnvironment {
  const nav: (Navigator & Pick<RuntimeEnvironmentSignals, 'userAgentData'>) | undefined =
    typeof navigator === 'undefined' ? undefined : navigator;
  const win = typeof window === 'undefined' ? undefined : window;
  return detectRuntimeEnvironment({
    userAgent: nav?.userAgent,
    platform: nav?.platform,
    maxTouchPoints: nav?.maxTouchPoints,
    userAgentData: nav?.userAgentData,
    width: win?.innerWidth,
    height: win?.innerHeight,
    coarsePointer: win?.matchMedia?.(INPUT_QUERIES[0]).matches,
    finePointer: win?.matchMedia?.(INPUT_QUERIES[1]).matches,
    hover: win?.matchMedia?.(INPUT_QUERIES[2]).matches,
  });
}

/** 订阅时立即同步；调整窗口、旋转或更换输入设备后重读，返回函数释放全部监听。 */
export function observeRuntimeEnvironment(
  receive: (environment: RuntimeEnvironment) => void,
): () => void {
  const refresh = () => receive(readRuntimeEnvironment());
  refresh();
  if (typeof window === 'undefined') return () => {};
  const target = window;
  const queries = INPUT_QUERIES.map(query => target.matchMedia?.(query));
  target.addEventListener('resize', refresh, { passive: true });
  target.addEventListener('orientationchange', refresh, { passive: true });
  for (const query of queries) query?.addEventListener('change', refresh);
  return () => {
    target.removeEventListener('resize', refresh);
    target.removeEventListener('orientationchange', refresh);
    for (const query of queries) query?.removeEventListener('change', refresh);
  };
}
