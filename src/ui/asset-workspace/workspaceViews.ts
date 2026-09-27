import { createGraphCanvasView, type GraphCanvasView } from '../action-graph/graphCanvasView';
import { createResourceEditorView, type ResourceEditorView } from '../editor/resourceEditorView';

/** 浏览状态只在工作区打开期间保留，不属于资产定义或修改历史。 */
export interface WorkspaceResourceView extends ResourceEditorView {
  page: string;
  toolTab: string;
  graphOpen: boolean;
  canvases: Record<string, GraphCanvasView>;
}

export interface WorkspaceDocumentViews {
  resources: Record<string, WorkspaceResourceView>;
}

export function createWorkspaceDocumentViews(): WorkspaceDocumentViews {
  return { resources: {} };
}

export function resourceView(
  views: WorkspaceDocumentViews,
  resource: string,
): WorkspaceResourceView {
  return (views.resources[resource] ??= {
    ...createResourceEditorView(),
    page: 'overview',
    toolTab: 'content',
    graphOpen: false,
    canvases: {},
  });
}

export function canvasView(view: WorkspaceResourceView, graph: string): GraphCanvasView {
  return (view.canvases[graph] ??= createGraphCanvasView());
}
