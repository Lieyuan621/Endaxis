import { createRouter, createWebHistory } from 'vue-router'
import TimelineEditor from '../views/TimelineEditor.vue'
import DataEditor from '../views/DataEditor.vue'

const routes = [
    {
        path: '/',
        name: 'TimelineEditor',
        component: TimelineEditor
    },
    {
        path: '/editor',
        name: 'DataEditor',
        component: DataEditor
    }
]

const router = createRouter({
    history: createWebHistory('/Endaxis/'),
    routes
})

export default router