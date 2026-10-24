import { createApp } from 'vue';
import { createPinia } from 'pinia';
import type { Router } from 'vue-router';
import 'element-plus/dist/index.css';
import 'element-plus/theme-chalk/dark/css-vars.css';
import '../design-system/styles/index.css';

import App from '../App.vue';
import { i18n, setLocale } from '../i18n';
import { bootstrapAppearance } from '../ui/appearance/useAppearance';

/** 网页和桌面编辑器共用启动与首轮模拟遮罩；宿主只负责提供路由。 */
export async function bootstrapTimeline(router: Router): Promise<void> {
  bootstrapAppearance();
  // 首屏先加载 UI 文本；各路由在进入前声明自身需要的游戏文本 family。
  await setLocale(i18n.global.locale.value, []);

  const app = createApp(App);
  app.use(createPinia());
  app.use(router);
  app.use(i18n);
  // 资源失败时保留可恢复的启动屏，不能挂载空 RouterView。
  await router.isReady();
  app.mount('#app');
  // App 在编辑器完整模拟结果发出 initial-ready 后移除启动遮罩。
}
