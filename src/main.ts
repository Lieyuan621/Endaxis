import { createApp } from 'vue';
import { createPinia } from 'pinia';
import ElementPlus from 'element-plus';
import 'element-plus/dist/index.css';
import 'element-plus/theme-chalk/dark/css-vars.css';
import './design-system/styles/index.css';

import App from './App.vue';

import router from './router';
import { i18n, setLocale } from './i18n';
import { bootstrapAppearance } from './composables/useAppearance';

bootstrapAppearance();

const app = createApp(App);
const pinia = createPinia();

app.use(pinia);
app.use(ElementPlus);
app.use(router);
app.use(i18n);

setLocale(i18n.global.locale.value);

app.mount('#app');
