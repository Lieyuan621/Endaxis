import { describe, expect, it } from 'vitest';
import { canvasView, createWorkspaceDocumentViews, resourceView } from './workspaceViews';

describe('资产内部资源的浏览状态', () => {
  it('离开资源后保留页面与工具标签，其他资源和派生文档互不影响', () => {
    const source = createWorkspaceDocumentViews();
    const skill = resourceView(source, 'skills/attack');
    Object.assign(skill, { page: 'timing', graphOpen: true, toolTab: 'variables' });
    expect(resourceView(source, 'buffs/boost')).toMatchObject({
      page: 'overview',
      graphOpen: false,
      toolTab: 'content',
      canvases: {},
    });
    expect(resourceView(source, 'skills/attack')).toBe(skill);
    const derived = createWorkspaceDocumentViews();
    resourceView(derived, 'skills/attack').toolTab = 'find';
    expect(resourceView(source, 'skills/attack')).toMatchObject({
      page: 'timing',
      graphOpen: true,
      toolTab: 'variables',
      canvases: {},
    });
  });
  it('各资源的主图和宏分别保留视口，关闭后重新打开的文档从默认位置开始', () => {
    const document = createWorkspaceDocumentViews();
    const skill = resourceView(document, 'skills/attack');
    const main = canvasView(skill, 'main');
    Object.assign(main.camera, { x: 120, y: -340, zoom: 0.7 });
    main.positioned = true;
    expect(canvasView(skill, 'macro:damage').positioned).toBe(false);
    expect(canvasView(resourceView(document, 'buffs/boost'), 'main').camera.zoom).toBe(1);
    expect(canvasView(resourceView(document, 'skills/attack'), 'main')).toBe(main);
    expect(
      canvasView(resourceView(createWorkspaceDocumentViews(), 'skills/attack'), 'main').positioned,
    ).toBe(false);
  });
});
