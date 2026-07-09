import { createRouter, createWebHistory } from 'vue-router'

const routes = [
    { path: '/', redirect: '/timeline' },
    { path: '/timeline', name: 'Timeline', component: () => import('../views/TimelineEntry.vue') }
]

const router = createRouter({
    history: createWebHistory('/'),
    routes
})

export default router