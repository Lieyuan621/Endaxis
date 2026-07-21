import { hexToRgba } from '@/utils/theme';

const GHOST_ID = 'custom-drag-ghost';
const GHOST_HINT_CLASS = 'library-drag-ghost-hint';
const DEFAULT_DRAG_OFFSET_X = 10;
const DEFAULT_DRAG_OFFSET_Y = 25;

/** Delay before showing the cancel-hint bubble while a skill sticks to the cursor. */
export const LIBRARY_PLACE_CANCEL_HINT_DELAY_MS = 5000;

type SkillThemeColorResolver = (skill: Record<string, unknown>) => string;

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
    overflow: 'visible',
  });
  document.body.appendChild(ghost);
  return ghost;
}

/** Attach a cancel-hint bubble under the ghost (follows mouse with the ghost). */
export function attachLibraryDragGhostHint(text: string): void {
  const ghost = document.getElementById(GHOST_ID);
  if (!ghost || ghost.querySelector(`.${GHOST_HINT_CLASS}`)) return;

  const hint = document.createElement('div');
  hint.className = GHOST_HINT_CLASS;
  hint.textContent = text;
  Object.assign(hint.style, {
    position: 'absolute',
    top: 'calc(100% + 10px)',
    left: '50%',
    transform: 'translateX(-50%)',
    padding: '6px 10px',
    borderRadius: '6px',
    background: 'rgba(20, 20, 20, 0.92)',
    border: '1px solid rgba(255, 215, 0, 0.45)',
    boxShadow: '0 4px 14px rgba(0, 0, 0, 0.45)',
    color: '#f5f5f5',
    fontSize: '11px',
    fontWeight: '600',
    letterSpacing: '0.2px',
    textShadow: 'none',
    whiteSpace: 'nowrap',
    pointerEvents: 'none',
    zIndex: '1',
  });

  const caret = document.createElement('div');
  Object.assign(caret.style, {
    position: 'absolute',
    top: '-5px',
    left: '50%',
    width: '8px',
    height: '8px',
    transform: 'translateX(-50%) rotate(45deg)',
    background: 'rgba(20, 20, 20, 0.92)',
    borderLeft: '1px solid rgba(255, 215, 0, 0.45)',
    borderTop: '1px solid rgba(255, 215, 0, 0.45)',
  });
  hint.appendChild(caret);
  ghost.appendChild(hint);
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
