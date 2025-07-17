import type { RouteRecordRaw } from 'vue-router'
import type { UserRole } from '@/types/api'

export interface RouteMeta {
  title?: string
  requiresAuth?: boolean
  roles?: UserRole[]
  icon?: string
  hidden?: boolean
}

export type AppRouteRecordRaw = RouteRecordRaw & {
  meta?: RouteMeta
  children?: AppRouteRecordRaw[]
}

// 基础路由（无需权限）
export const constantRoutes: AppRouteRecordRaw[] = [
  {
    path: '/login',
    name: 'Login',
    component: () => import('@/views/login/Login.vue'),
    meta: {
      title: '登录',
      hidden: true,
    },
  },
  {
    path: '/404',
    name: '404',
    component: () => import('@/views/error/404.vue'),
    meta: {
      title: '404',
      hidden: true,
    },
  },
  // 根路径重定向
  {
    path: '/',
    redirect: '/login',
    meta: {
      hidden: true,
    },
  },
  // 通配符路由，捕获所有未定义的路由，必须放在最后
  {
    path: '/:pathMatch(.*)*',
    redirect: '/404',
    meta: {
      hidden: true,
    },
  }
]

// 动态路由（需要权限）
export const asyncRoutes: AppRouteRecordRaw[] = [
  {
    path: '/',
    name: 'Layout',
    component: () => import('@/layouts/MainLayout.vue'),
    redirect: '/dashboard',
    meta: {
      title: '首页',
      requiresAuth: true,
    },
    children: [
      {
        path: '/dashboard',
        name: 'Dashboard',
        component: () => import('@/views/dashboard/Index.vue'),
        meta: {
          title: '仪表盘',
          icon: 'dashboard',
          roles: ['super_admin', 'director', 'leader', 'sales'],
          requiresAuth: true,
        },
      },
    ],
  },
  {
    path: '/user',
    name: 'User',
    component: () => import('@/layouts/MainLayout.vue'),
    redirect: '/user/list',
    meta: {
      title: '用户管理',
      icon: 'users',
      roles: ['super_admin', 'director', 'leader'],
      requiresAuth: true,
    },
    children: [
      {
        path: '/user/list',
        name: 'UserList',
        component: () => import('@/views/user/UserList.vue'),
        meta: {
          title: '用户列表',
          roles: ['super_admin', 'director', 'leader'],
          requiresAuth: true,
        },
      },
    ],
  },
  {
    path: '/lead',
    name: 'Lead',
    component: () => import('@/layouts/MainLayout.vue'),
    redirect: '/lead/list',
    meta: {
      title: '客资管理',
      icon: 'target',
      roles: ['super_admin', 'director', 'leader', 'sales'],
      requiresAuth: true,
    },
    children: [
      {
        path: '/lead/list',
        name: 'LeadList',
        component: () => import('@/views/lead/LeadList.vue'),
        meta: {
          title: '客资列表',
          roles: ['super_admin', 'director', 'leader', 'sales'],
          requiresAuth: true,
        },
      },
    ],
  },
  {
    path: '/deal',
    name: 'Deal',
    component: () => import('@/layouts/MainLayout.vue'),
    redirect: '/deal/list',
    meta: {
      title: '成交管理',
      icon: 'dollar-sign',
      roles: ['super_admin', 'director', 'leader', 'sales'],
      requiresAuth: true,
    },
    children: [
      {
        path: '/deal/list',
        name: 'DealList',
        component: () => import('@/views/deal/DealList.vue'),
        meta: {
          title: '成交列表',
          roles: ['super_admin', 'director', 'leader', 'sales'],
          requiresAuth: true,
        },
      },
    ],
  },
  {
    path: '/promotion',
    name: 'Promotion',
    component: () => import('@/layouts/MainLayout.vue'),
    redirect: '/promotion/audit',
    meta: {
      title: '推广管理',
      icon: 'megaphone',
      roles: ['super_admin', 'director', 'leader'],
      requiresAuth: true,
    },
    children: [
      {
        path: '/promotion/audit',
        name: 'PromotionAudit',
        component: () => import('@/views/promotion/AuditList.vue'),
        meta: {
          title: '推广审核',
          roles: ['super_admin', 'director', 'leader'],
          requiresAuth: true,
        },
      },
    ],
  },
  {
    path: '/settings',
    name: 'Settings',
    component: () => import('@/layouts/MainLayout.vue'),
    redirect: '/settings/level',
    meta: {
      title: '系统配置',
      icon: 'settings',
      roles: ['super_admin'],
      requiresAuth: true,
    },
    children: [
      {
        path: '/settings/level',
        name: 'LevelConfig',
        component: () => import('@/views/settings/LevelRule.vue'),
        meta: {
          title: '等级规则',
          roles: ['super_admin'],
          requiresAuth: true,
        },
      },
    ],
  },
]

// 根据角色过滤路由
export function filterRoutesByRole(
  routes: AppRouteRecordRaw[], 
  userRoles: string[]
): AppRouteRecordRaw[] {
  return routes.filter(route => {
    if (!route.meta?.roles) return true
    return route.meta.roles.some(role => userRoles.includes(role))
  }).map(route => {
    if (route.children) {
      return {
        ...route,
        children: filterRoutesByRole(route.children, userRoles),
      }
    }
    return route
  })
}