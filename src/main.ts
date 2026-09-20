import { createApp } from 'vue';
import { createPinia } from 'pinia';
import 'element-plus/dist/index.css';
import 'element-plus/theme-chalk/dark/css-vars.css';
import './design-system/styles/index.css';

import App from './App.vue';

import router from './router';
import { i18n, setLocale } from './i18n';
import { bootstrapAppearance } from './ui/appearance/useAppearance';
import { showBootstrapFailure } from './bootstrapFailure';

async function bootstrap() {
  bootstrapAppearance();
  // 首屏先加载 UI 文本；各路由在进入前声明自身需要的游戏文本 family。
  await setLocale(i18n.global.locale.value, []);

  const app = createApp(App);
  const pinia = createPinia();
  app.use(pinia);
  app.use(router);
  app.use(i18n);
  // A failed initial route (including lazy game-text imports) used to mount
  // an empty RouterView and remove the loader, leaving only the background.
  await router.isReady();
  app.mount('#app');

  // 启动遮罩属于应用外壳；语言资源和首个路由完成挂载后再移除。
  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      document.getElementById('boot-loader')?.remove();
    });
  });
}

void bootstrap().catch(showBootstrapFailure);
