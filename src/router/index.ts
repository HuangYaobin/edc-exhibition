import { createRouter, createWebHistory } from 'vue-router'

// App.vue 直接作为根组件挂载，路由仅用作"当前展位 ID"的状态容器，
// 因此各路由不需要真正渲染组件，使用空组件占位即可。
const Empty = { render: () => null }

const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: '/', name: 'home', component: Empty },
    { path: '/booths/:id', name: 'booth', component: Empty },
    { path: '/:pathMatch(.*)*', redirect: '/' },
  ],
})

export default router
