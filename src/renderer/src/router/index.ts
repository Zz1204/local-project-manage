import { createRouter, createWebHashHistory } from 'vue-router'

const router = createRouter({
  history: createWebHashHistory(),
  routes: [
    {
      path: '/',
      name: 'home',
      component: () => import('../views/home.vue')
    },
    {
      path: '/project/add',
      name: 'project-add',
      component: () => import('../views/project-form.vue')
    }
  ]
})

export default router
