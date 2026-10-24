import { createApp } from 'vue';
import OverlayToolbar from './OverlayToolbar.vue';
import { desktopI18n } from '../../../i18n';
import './window.css';

createApp(OverlayToolbar).use(desktopI18n).mount('#app');
