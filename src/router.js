import { createRouter, createWebHistory } from 'vue-router'

import Home from './pages/Home.vue'
import Login from './pages/Login.vue'
import SongView from './pages/SongView.vue'
import Upload from './pages/Upload.vue'

export const router = createRouter({
    history: createWebHistory(),
    routes: [
        { path: '/', component: Home },
        { path: '/login', component: Login },
        { path: '/upload', component: Upload },
        { path: '/songs/:id', component: SongView },
    ],
})