// Router configuration terkait halaman Kelola Pertanyaan
// File asli: frontend-lpk/src/router/index.js

import { createRouter, createWebHistory } from "vue-router";
import Login from '../components/admin/login_admin.vue'

const router = createRouter({
    history: createWebHistory(import.meta.env.BASE_URL),
    routes: [
        {
            path: '/',
            name: 'login-admin',
            component: Login
        },
        {
            path: '/form-lpk',
            name: 'form-lpk',
            component: () => import('../components/user/form_lpk.vue')
        },
        {
            path: '/log-permintaan',
            name: 'log-permintaan',
            component: () => import('../components/user/log_permintaan.vue')
        },
        {
            path: '/data-monitor',
            name: 'data-monitor',
            component: () => import('../components/admin/data-monitor.vue')
        },
        {
            path: '/kelola-pertanyaan',      // ← Route untuk halaman kelola pertanyaan
            name: 'kelola-pertanyaan',
            component: () => import('../components/admin/kelola-pertanyaan.vue')  // Lazy loaded
        },
        {
            path: '/departemen',
            name: 'departemen',
            component: () => import('../components/admin/departemen.vue')
        },
        {
            path: '/pengguna',
            name: 'pengguna',
            component: () => import('../components/admin/pengguna.vue')
        },
        {
            path: '/profil',
            name: 'profil',
            component: () => import('../components/admin/profil.vue')
        },
    ],
    scrollBehavior(to, from, savedPosition) {
        return { top: 0 }
    }
})

export default router;
