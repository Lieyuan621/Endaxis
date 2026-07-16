export interface PortDirection {
  x: number;
  y: number;
  cx: number;
  cy: number;
}

export const PORT_DIRECTIONS: Record<string, PortDirection> = {
  top: { x: 0.5, y: 0, cx: 0, cy: -1 },
  bottom: { x: 0.5, y: 1, cx: 0, cy: 1 },
  left: { x: 0, y: 0.5, cx: -1, cy: 0 },
  right: { x: 1, y: 0.5, cx: 1, cy: 0 },
  'top-left': { x: 0, y: 0, cx: -1, cy: -1 },
  'top-right': { x: 1, y: 0, cx: 1, cy: -1 },
  'bottom-left': { x: 0, y: 1, cx: -1, cy: 1 },
  'bottom-right': { x: 1, y: 1, cx: 1, cy: 1 },
};

export interface RectLike {
  left: number;
  top: number;
  width: number;
  height: number;
}

export interface Point {
  x: number;
  y: number;
}

export function getRectPos(rect: RectLike, position: string): Point {
  switch (position) {
    case 'center':
      return {
        x: rect.left + rect.width / 2,
        y: rect.top + rect.height / 2,
      };
    case 'left':
      return {
        x: rect.left,
        y: rect.top + rect.height / 2,
      };
    case 'right':
      return {
        x: rect.left + rect.width,
        y: rect.top + rect.height / 2,
      };
    case 'top':
      return {
        x: rect.left + rect.width / 2,
        y: rect.top,
      };
    case 'bottom':
      return {
        x: rect.left + rect.width / 2,
        y: rect.top + rect.height,
      };
    default:
      return { x: 0, y: 0 };
  }
}
