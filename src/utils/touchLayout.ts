export const TOUCH_LAYOUT_MAX_WIDTH = 1366;

export interface TouchLayoutEnvironment {
  viewportWidth: number;
  coarsePointer: boolean;
  userAgent?: string;
  platform?: string;
  maxTouchPoints?: number;
}

export function shouldUseTouchLayout(environment: TouchLayoutEnvironment): boolean {
  const viewportWidth = Number(environment.viewportWidth) || 0;
  if (viewportWidth <= 0 || viewportWidth > TOUCH_LAYOUT_MAX_WIDTH) return false;

  const userAgent = environment.userAgent || '';
  const platform = environment.platform || '';
  const maxTouchPoints = Number(environment.maxTouchPoints) || 0;
  const mobilePlatform = /Android|iPad|iPhone|iPod/i.test(userAgent);
  const iPadWithDesktopUserAgent = platform === 'MacIntel' && maxTouchPoints > 1;

  return environment.coarsePointer || mobilePlatform || iPadWithDesktopUserAgent;
}
