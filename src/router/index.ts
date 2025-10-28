import { createRouter, createWebHashHistory } from 'vue-router'
import axios from '../api/axios';

const router = createRouter({
  history: createWebHashHistory(),
  routes: [
    {
      path:'/',
      redirect:'/login'
    },
    {
      path: "/login",
      component: () => import("@/views/login/Login.vue"),
      meta: { hidden: true },
    },
    {
      path: "/home",
      component: () => import("@/views/home/Home.vue"),
      meta: { hidden: true },
    },
    {
      path: "/list",
      component: () => import("@/views/devices/index.vue"),
      meta: { hidden: true },
    },
    {
      path: "/totalview",
      component: () => import("@/views/totalview/TotalView.vue"),
      meta: { hidden: true },
    },
    {
      path: "/group",
      component: () => import("@/views/group/index.vue"),
      meta: { hidden: true },
    },
    {
      path: "/vnc",
      component: () => import("@/views/vnc.vue"),
      meta: { hidden: true },
    },
  ]
})

router.beforeEach(async (to, from, next) => {
  const publicPages = ['/login'];
  if (!publicPages.includes(to.path)) {
    const res = await axios.get('/v1/group/login');
    if (res?.data?.status != 0) {
      next({ path: '/login' });
    } else {
      next();
    }
  } else {
    next();
  }
});

export default router
