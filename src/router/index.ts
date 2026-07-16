import { createRouter, createWebHistory, type RouteRecordRaw } from 'vue-router';

const routes: RouteRecordRaw[] = [
  { path: '/', redirect: '/timeline' },
  { path: '/timeline', name: 'Timeline', component: () => import('../views/TimelineEntry.vue') },
];

const router = createRouter({
  history: createWebHistory('/'),
  routes,
});

export default router;
