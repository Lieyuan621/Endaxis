const GHOST_ID = 'custom-drag-ghost';
const DEFAULT_DRAG_OFFSET_X = 10;
const DEFAULT_DRAG_OFFSET_Y = 25;

export function hexToRgba(hex: string | null | undefined, alpha: number): string {
  if (!hex) return `rgba(255,255,255,${alpha})`;
  let chars = hex.substring(1).split('');
  if (chars.length === 3) {
    const [a, b, c] = chars;
    chars = [a!, a!, b!, b!, c!, c!];
  }
  const n = Number('0x' + chars.join(''));
  return `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},${alpha})`;
}

export type SkillThemeColorResolver = (skill: Record<string, unknown>) => string;

export function createLibraryDragGhost(
  skill: Record<string, unknown>,
  timeBlockWidth: number,
  getThemeColor: SkillThemeColorResolver,
): HTMLDivElement {
  removeLibraryDragGhost();

  const ghost = document.createElement('div');
  ghost.id = GHOST_ID;

  const duration = Number(skill.duration) || 0;
  const themeColor = getThemeColor(skill);
  const realWidth = (duration || 1) * timeBlockWidth;

  ghost.textContent = String(skill.name || '');
  Object.assign(ghost.style, {
    position: 'fixed',
    top: '-9999px',
    left: '-9999px',
    width: `${realWidth}px`,
    height: '50px',
    border: `2px dashed ${themeColor}`,
    backgroundColor: hexToRgba(themeColor, 0.2),
    color: '#ffffff',
    boxShadow: `0 0 10px ${themeColor}`,
    textShadow: `0 1px 2px rgba(0,0,0,0.8)`,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    boxSizing: 'border-box',
    fontSize: '12px',
    fontWeight: 'bold',
    zIndex: '999999',
    pointerEvents: 'none',
    fontFamily: 'sans-serif',
    whiteSpace: 'nowrap',
    backdropFilter: 'blur(4px)',
  });
  document.body.appendChild(ghost);
  return ghost;
}

export function positionLibraryDragGhost(
  clientX: number,
  clientY: number,
  dragOffsetX = DEFAULT_DRAG_OFFSET_X,
  dragOffsetY = DEFAULT_DRAG_OFFSET_Y,
): void {
  const ghost = document.getElementById(GHOST_ID);
  if (!ghost) return;
  ghost.style.left = `${clientX - dragOffsetX}px`;
  ghost.style.top = `${clientY - dragOffsetY}px`;
}

export function removeLibraryDragGhost(): void {
  const el = document.getElementById(GHOST_ID);
  if (el?.parentNode) el.parentNode.removeChild(el);
}

export function getDefaultLibraryDragOffsets(): { dragOffsetX: number; dragOffsetY: number } {
  return { dragOffsetX: DEFAULT_DRAG_OFFSET_X, dragOffsetY: DEFAULT_DRAG_OFFSET_Y };
}
