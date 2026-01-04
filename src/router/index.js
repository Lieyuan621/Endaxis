import { createRouter, createWebHistory } from 'vue-router'

const routes = [
    { path: '/', redirect: '/timeline' },
    { path: '/timeline', name: 'TimelineEditor', component: () => import('../views/TimelineEditor.vue') },
    { path: '/editor', name: 'DataEditor', component: () => import('../views/DataEditor.vue') }
]

const router = createRouter({
    history: createWebHistory('/'),
    routes
})

export default router