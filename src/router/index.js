import { createRouter, createWebHistory } from 'vue-router'

const routes = [
    { path: '/', redirect: '/Endaxis' },
    { path: '/Endaxis', name: 'TimelineEditor', component: () => import('../views/TimelineEditor.vue') },
    { path: '/Endaxis/editor', name: 'DataEditor', component: () => import('../views/DataEditor.vue') }
]

const router = createRouter({
    history: createWebHistory('/'),
    routes
})

export default router