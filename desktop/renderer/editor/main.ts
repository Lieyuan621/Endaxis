import { bootstrapTimeline } from '@/app/bootstrap';
import { createTimelineRouter } from '@/router';
import { showBootstrapFailure } from '@/bootstrapFailure';

// 开发服务器使用独立 HTML；应用内路由始终使用同一个 /timeline 地址。
if (window.location.pathname.endsWith('/desktop/renderer/editor/index.html')) {
  window.history.replaceState(null, '', `/timeline${window.location.search}`);
}

void bootstrapTimeline(
  createTimelineRouter({
    timelineComponent: () => import('./DesktopTimelineEditor.vue'),
  }),
).catch(showBootstrapFailure);
