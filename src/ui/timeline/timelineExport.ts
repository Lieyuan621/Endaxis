/** 时间轴导出的文件名、压缩数据码、下载和长图渲染工具。 */

export function projectFilename(value: string, fallback = 'Endaxis_Export'): string {
  const base = value.trim().replace(/\.(?:json|webp|png)$/i, '') || fallback;
  return `${base}.json`;
}

export function imageFilename(value: string, fallback = 'Endaxis_Export'): string {
  const base = value.trim().replace(/\.(?:json|webp|png)$/i, '') || fallback;
  return `${base}.png`;
}

export function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  anchor.hidden = true;
  document.body.append(anchor);
  try {
    anchor.click();
  } finally {
    anchor.remove();
    setTimeout(() => URL.revokeObjectURL(url), 30_000);
  }
}

/** 使用与旧版相同的 gzip + URL-safe Base64 数据码格式。 */
export async function compressProjectCode(json: string): Promise<string> {
  const bytes = new TextEncoder().encode(json);
  const stream = new Blob([bytes]).stream().pipeThrough(new CompressionStream('gzip'));
  const compressed = new Uint8Array(await new Response(stream).arrayBuffer());
  let binary = '';
  // 分段转换，避免大型项目展开为函数参数导致栈溢出。
  for (let offset = 0; offset < compressed.length; offset += 0x8000) {
    binary += String.fromCharCode(...compressed.subarray(offset, offset + 0x8000));
  }
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

/** 读取本版及旧版共用的 gzip + URL-safe Base64 数据码。 */
export async function decompressProjectCode(code: string): Promise<string> {
  const trimmed = code.trim();
  if (!/^[A-Za-z0-9_-]+={0,2}$/.test(trimmed)) throw new Error('无效的数据码');
  const base64 = trimmed
    .replace(/-/g, '+')
    .replace(/_/g, '/')
    .padEnd(Math.ceil(trimmed.length / 4) * 4, '=');
  const bytes = Uint8Array.from(atob(base64), character => character.charCodeAt(0));
  return new Response(
    new Blob([bytes]).stream().pipeThrough(new DecompressionStream('gzip')),
  ).text();
}

export interface TimelineLongImageOptions {
  readonly durationSeconds: number;
  readonly pxPerFrame: number;
  readonly prepWidth: number;
  readonly trackHeaderWidth: number;
}

/**
 * 截取当前时间轴主区域。渲染期间临时展开裁剪和滚动位置，完成后恢复内联样式与滚动。
 */
export async function captureTimelineLongImage(
  timelineMain: HTMLElement,
  options: TimelineLongImageOptions,
): Promise<Blob> {
  const { snapdom } = await import('@zumer/snapdom');
  const width = Math.ceil(
    options.trackHeaderWidth +
      options.prepWidth +
      options.durationSeconds * 30 * options.pxPerFrame +
      50,
  );
  const center = timelineMain.querySelector<HTMLElement>('.timeline-center');
  const workspace = timelineMain.querySelector<HTMLElement>('.timeline-workspace');
  const timelineScroll = timelineMain.querySelector<HTMLElement>('.timeline-scroll');
  const surface = timelineMain.querySelector<HTMLElement>('.timeline-surface');
  const bottomPanel = timelineMain.querySelector<HTMLElement>('.bottom-panel');
  const bottomSections = bottomPanel?.querySelector<HTMLElement>('.enemy-status-sections');
  const horizontalElements = [
    center,
    workspace,
    timelineScroll,
    surface,
    timelineMain.querySelector<HTMLElement>('.track-stack'),
  ].filter((element): element is HTMLElement => element !== null);
  const bottomElements = [
    bottomPanel,
    bottomPanel?.querySelector<HTMLElement>('.simulation-panel'),
    bottomPanel?.querySelector<HTMLElement>('.simulation-curves'),
    bottomSections,
  ].filter((element): element is HTMLElement => element != null);
  const elements = [
    timelineMain,
    ...horizontalElements,
    ...bottomElements,
  ];
  const styles = new Map(elements.map(element => [element, element.style.cssText]));
  const scrollers = Array.from(
    timelineMain.querySelectorAll<HTMLElement>('.timeline-scroll, .timeline-horizontal-scrollbar'),
  );
  const scroll = new Map(
    scrollers.map(element => [element, { left: element.scrollLeft, top: element.scrollTop }]),
  );
  try {
    timelineMain.style.width = `${width}px`;
    timelineMain.style.minWidth = `${width}px`;
    timelineMain.style.overflow = 'visible';
    for (const element of horizontalElements) {
      element.style.width = `${width}px`;
      element.style.maxWidth = 'none';
      element.style.overflow = 'visible';
    }
    for (const element of scrollers) {
      element.scrollLeft = 0;
      element.scrollTop = 0;
    }
    await new Promise<void>(resolve =>
      requestAnimationFrame(() => requestAnimationFrame(() => resolve())),
    );
    // The workbench uses viewport-sized subgrid rows. Widening alone leaves the
    // tracks and the status/resource panel clipped at their on-screen heights.
    const headerHeight = timelineMain.querySelector<HTMLElement>('.timeline-header')?.offsetHeight ?? 0;
    const resizerHeight = timelineMain.querySelector<HTMLElement>('.bottom-resizer')?.offsetHeight ?? 0;
    const centerHeight = Math.max(
      center?.clientHeight ?? 0,
      timelineScroll?.scrollHeight ?? 0,
      surface?.scrollHeight ?? 0,
    );
    const bottomHeight = bottomPanel === null || getComputedStyle(bottomPanel).display === 'none'
      ? 0
      : Math.max(
          bottomPanel.clientHeight,
          bottomPanel.scrollHeight,
          ...Array.from(bottomPanel.querySelectorAll<HTMLElement>('*'), element => element.scrollHeight),
        );
    const height = Math.max(1, Math.ceil(headerHeight + centerHeight + resizerHeight + bottomHeight));
    timelineMain.style.height = `${height}px`;
    timelineMain.style.minHeight = `${height}px`;
    timelineMain.style.gridTemplateRows = `${headerHeight}px ${centerHeight}px ${resizerHeight}px ${bottomHeight}px`;
    for (const element of [center, workspace, timelineScroll]) {
      if (element === null) continue;
      element.style.height = `${centerHeight}px`;
      element.style.minHeight = `${centerHeight}px`;
    }
    if (bottomHeight > 0) {
      for (const element of bottomElements) {
        element.style.height = `${bottomHeight}px`;
        element.style.minHeight = `${bottomHeight}px`;
        element.style.overflow = 'visible';
      }
    }
    await new Promise<void>(resolve =>
      requestAnimationFrame(() => requestAnimationFrame(() => resolve())),
    );
    // Keep both dimensions within the browser canvas budget for long or tall axes.
    // instead of silently returning only the leading part of the timeline.
    const scale = Math.min(1.5, 16_000 / width, 16_000 / height);
    const capture = await snapdom(timelineMain, {
      scale,
      width,
      height,
      backgroundColor: getComputedStyle(timelineMain).backgroundColor || '#191a1d',
      exclude: ['.timeline-horizontal-scrollbar', '.bottom-panel-collapse'],
    });
    return await capture.toBlob({ type: 'png', dpr: 1 });
  } finally {
    for (const [element, cssText] of styles) element.style.cssText = cssText;
    for (const [element, position] of scroll) {
      element.scrollLeft = position.left;
      element.scrollTop = position.top;
    }
  }
}
