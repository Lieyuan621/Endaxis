import { createApp } from 'vue';
import OverlayView from './OverlayView.vue';
import { desktopI18n } from '../../../i18n';
import './window.css';

createApp(OverlayView).use(desktopI18n).mount('#app');
