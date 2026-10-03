import { createApp } from 'vue';
import 'element-plus/dist/index.css';
import '../../../src/design-system/styles/index.css';
import { i18n, setLocale } from '../../../src/i18n';
import Harness from './Harness.vue';
await setLocale('en', []);
createApp(Harness).use(i18n).mount('#app');
