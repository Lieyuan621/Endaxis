/**
 * 叠加窗口的路由判断。
 *
 * 叠加页是独立的浏览器窗口（也可以是 OBS 浏览器源），它只读取本地存档，
 * 因此不能安装自动保存监听——否则两个窗口会互相覆盖 `endaxis_autosave`。
 */

export const OVERLAY_ROUTE_PATH = '/overlay';

export function isOverlayPath(
  location: Pick<Location, 'pathname' | 'hash'> | null = typeof window !== 'undefined'
    ? window.location
    : null,
): boolean {
  if (!location) return false;
  const pathname = String(location.pathname || '').replace(/\/+$/, '');
  if (pathname === OVERLAY_ROUTE_PATH || pathname.endsWith(OVERLAY_ROUTE_PATH)) return true;
  return String(location.hash || '').startsWith(`#${OVERLAY_ROUTE_PATH}`);
}

/** 叠加窗口的完整地址（相对当前站点，兼容部署在子路径的情况）。 */
export function overlayUrl(): string {
  const base = (import.meta.env?.BASE_URL as string | undefined) ?? '/';
  return `${base.replace(/\/+$/, '')}${OVERLAY_ROUTE_PATH}`;
}
