import { createRouter, createWebHistory } from 'vue-router'

import Home from './pages/Home.vue'
import Upload from './pages/Upload.vue'
import SongView from './pages/SongView.vue'
import Auth from './pages/Auth.vue'

const router = createRouter({
    history: createWebHistory(),
    routes: [
        { path: '/', component: Home },
        { path: '/upload', component: Upload },
        { path: '/songs/:id', component: SongView },
        { path: '/auth', component: Auth },
    ],
})

export default router