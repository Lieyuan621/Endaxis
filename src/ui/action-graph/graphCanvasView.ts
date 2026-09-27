/** 画布的临时浏览位置，与节点布局、图定义和撤销历史分开保存。 */
export interface GraphCanvasView {
  camera: { x: number; y: number; zoom: number };
  positioned: boolean;
}

export function createGraphCanvasView(): GraphCanvasView {
  return { camera: { x: 0, y: 0, zoom: 1 }, positioned: false };
}
