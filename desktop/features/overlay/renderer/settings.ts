import { createApp } from 'vue';
import OverlaySettings from './OverlaySettings.vue';
import { desktopI18n } from '../../../i18n';
import './window.css';

createApp(OverlaySettings).use(desktopI18n).mount('#app');
