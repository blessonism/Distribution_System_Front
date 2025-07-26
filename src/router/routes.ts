import type { RouteRecordRaw } from 'vue-router'
import type { UserRole } from '@/types/api'

export interface RouteMeta {
  title?: string
  requiresAuth?: boolean
  roles?: UserRole[]
  icon?: string
  hidden?: boolean
  group?: 'main' | 'business' | 'system'  // 导航菜单分组
  // 添加保存滚动位置和状态的配置
  keepAlive?: boolean         // 是否缓存组件
  saveScrollPosition?: boolean // 是否保存滚动位置
  transition?: string         // 过渡动画名称
  breadcrumb?: {              // 面包屑配置
    title: string;
    parent?: string;
  }[];
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
  // 根路径 - 由路由守卫处理重定向逻辑
  {
    path: '/',
    name: 'Root',
    component: () => import('@/views/Redirect.vue'), // 简单的重定向占位组件
    meta: {
      hidden: true,
      requiresAuth: true, // 标记需要认证，让路由守卫处理
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
  // 移除冲突的根路径Layout路由，避免与constantRoutes中的根路径冲突
  // 个人设置路由
  {
    path: '/profile',
    name: 'Profile',
    component: () => import('@/layouts/MainLayout.vue'),
    meta: {
      title: '个人设置',
      requiresAuth: true,
      hidden: true, // 在菜单中隐藏
    },
    children: [
      {
        path: '',
        name: 'ProfileIndex',
        component: () => import('@/views/profile/Index.vue'),
        meta: {
          title: '个人设置',
          requiresAuth: true,
          hidden: true,
        },
      },
    ]
  },
  // 将dashboard配置为独立的一级路由
  {
    path: '/dashboard',
    name: 'Dashboard',
    component: () => import('@/layouts/MainLayout.vue'),
    meta: {
      title: '仪表盘',
      icon: 'dashboard',
      roles: ['super_admin', 'director', 'leader', 'sales'],
      requiresAuth: true,
      group: 'business'
    },
    children: [
      {
        path: '',
        name: 'DashboardIndex',
        component: () => import('@/views/dashboard/Index.vue'),
        meta: {
          title: '仪表盘',
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
      group: 'business'
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
      {
        path: '/user/hierarchy',
        name: 'PersonnelHierarchy',
        component: () => import('@/views/personnel/Hierarchy.vue'),
        meta: { 
          title: '层级关系',
          roles: ['super_admin', 'director', 'leader'],
          requiresAuth: true
        }
      }
    ]
  },
  {
    path: '/agent',
    name: 'Agent',
    component: () => import('@/layouts/MainLayout.vue'),
    redirect: '/agent/list',
    meta: {
      title: '代理管理',
      icon: 'users-2',
      roles: ['super_admin', 'director', 'leader'],
      requiresAuth: true,
      group: 'business'
    },
    children: [
      {
        path: '/agent/list',  // 使用绝对路径，与其他路由保持一致
        name: 'AgentList',
        component: () => import('@/views/agent/AgentList.vue'),
        meta: {
          title: '代理列表',
          roles: ['super_admin', 'director', 'leader'],
          requiresAuth: true,
          keepAlive: true, // 启用组件缓存
          saveScrollPosition: true, // 保存滚动位置
        },
      },
      {
        path: '/agent/:id',  // 使用绝对路径，与其他路由保持一致
        name: 'AgentDetail',
        component: () => import('@/views/agent/AgentDetail.vue'),
        props: true, // 启用props传参
        meta: {
          title: '代理详情',
          roles: ['super_admin', 'director', 'leader'],
          requiresAuth: true,
          hidden: true,
          transition: 'slide-left', // 添加进入动画
          breadcrumb: [
            { title: '代理管理' },
            { title: '代理列表', parent: 'AgentList' },
            { title: '代理详情' }
          ]
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
      group: 'business'
    },
    children: [
      {
        path: '/lead/list',
        name: 'LeadList',
        component: () => import('@/views/lead/LeadList.vue'),
        meta: {
          title: '客资管理',
          icon: 'target',
          group: 'business',
          roles: ['super_admin', 'director', 'leader', 'sales']
        }
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
      group: 'business'
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
    path: '/invitation',
    name: 'Invitation',
    component: () => import('@/layouts/MainLayout.vue'),
    redirect: '/invitation/codes',
    meta: {
      title: '邀请管理',
      icon: 'user-plus',
      roles: ['super_admin', 'director', 'leader', 'sales'],
      requiresAuth: true,
      group: 'business'
    },
    children: [
      {
        path: '/invitation/codes',
        name: 'InvitationCodes',
        component: () => import('@/views/invitation/InvitationCodes.vue'),
        meta: {
          title: '邀请码管理',
          roles: ['super_admin', 'director', 'leader', 'sales'],
          requiresAuth: true,
          keepAlive: true,
          saveScrollPosition: true,
          breadcrumb: [
            { title: '邀请管理' },
            { title: '邀请码管理' }
          ]
        },
      },
      {
        path: '/invitation/history',
        name: 'InvitationHistory',
        component: () => import('@/views/invitation/InvitationHistory.vue'),
        meta: {
          title: '邀请历史',
          roles: ['super_admin', 'director', 'leader', 'sales'],
          requiresAuth: true,
          keepAlive: true,
          saveScrollPosition: true,
          breadcrumb: [
            { title: '邀请管理' },
            { title: '邀请历史' }
          ]
        },
      },
    ],
  },
  {
    path: '/promotion',
    name: 'Promotion',
    component: () => import('@/layouts/MainLayout.vue'),
    redirect: '/promotion/audit', // 默认重定向到审核页面
    meta: {
      title: '推广管理',
      icon: 'megaphone',
      roles: ['super_admin', 'director', 'leader', 'agent'],
      requiresAuth: true,
      group: 'business'
    },
    children: [
      // 管理员路由
      {
        path: '/promotion/audit',
        name: 'PromotionAudit',
        component: () => import('@/views/promotion/AuditList.vue'),
        meta: {
          title: '推广审核',
          roles: ['super_admin', 'director', 'leader'],
          requiresAuth: true,
          breadcrumb: [
            { title: '推广管理', parent: '/promotion' },
            { title: '推广审核' }
          ]
        },
      },

      // 任务提交路由（代理和管理员都可访问）
      {
        path: '/promotion/submit',
        name: 'PromotionTaskSubmit',
        component: () => import('@/views/promotion/TaskSubmit.vue'),
        meta: {
          title: '提交任务',
          roles: ['super_admin', 'director', 'leader', 'agent'],
          requiresAuth: true,
          keepAlive: false, // 不缓存，确保每次都是新的表单
          breadcrumb: [
            { title: '推广管理', parent: '/promotion' },
            { title: '提交任务' }
          ]
        },
      },
      {
        path: '/promotion/my-tasks',
        name: 'PromotionMyTasks',
        component: () => import('@/views/promotion/TaskList.vue'),
        meta: {
          title: '我的任务',
          roles: ['super_admin', 'director', 'leader', 'agent'],
          requiresAuth: true,
          keepAlive: true, // 缓存列表页面，保持筛选状态
          saveScrollPosition: true, // 保存滚动位置
          breadcrumb: [
            { title: '推广管理', parent: '/promotion' },
            { title: '我的任务' }
          ]
        },
      },

      // 通用路由（所有角色都可访问）
      {
        path: '/promotion/task/:id',
        name: 'PromotionTaskDetail',
        component: () => import('@/views/promotion/TaskDetail.vue'),
        meta: {
          title: '任务详情',
          roles: ['super_admin', 'director', 'leader', 'agent'],
          requiresAuth: true,
          hidden: true, // 不在菜单中显示
          breadcrumb: [
            { title: '推广管理', parent: '/promotion' },
            { title: '任务详情' }
          ]
        },
      },

      // 奖励结算页面（代理和管理员都可访问）
      {
        path: '/promotion/rewards',
        name: 'PromotionRewards',
        component: () => import('@/views/promotion/RewardSettlements.vue'),
        meta: {
          title: '奖励结算',
          roles: ['super_admin', 'director', 'leader', 'agent'],
          requiresAuth: true,
          keepAlive: true, // 缓存页面，保持筛选状态
          saveScrollPosition: true, // 保存滚动位置
          breadcrumb: [
            { title: '推广管理', parent: '/promotion' },
            { title: '奖励结算' }
          ]
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
      group: 'system'
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
      {
        path: '/settings/agent-rules',
        name: 'AgentRules',
        component: () => import('@/views/settings/LevelRule.vue'), // 临时使用已存在的组件
        meta: {
          title: '代理规则',
          roles: ['super_admin'],
          requiresAuth: true,
        },
      },
      {
        path: '/settings/commission',
        name: 'CommissionRules',
        component: () => import('@/views/settings/LevelRule.vue'), // 临时使用已存在的组件
        meta: {
          title: '返佣规则',
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
    // 如果路由没有角色限制，允许访问
    if (!route.meta?.roles) return true
    // 检查用户角色是否匹配路由要求的角色
    return route.meta.roles.some(role => userRoles.includes(role))
  }).map(route => {
    if (route.children) {
      // 递归过滤子路由
      const filteredChildren = filterRoutesByRole(route.children, userRoles)
      return {
        ...route,
        children: filteredChildren,
      }
    }
    return route
  }).filter(route => {
    // 如果父路由有子路由，确保至少有一个子路由可访问
    if (route.children && route.children.length === 0) {
      return false
    }
    return true
  })
}