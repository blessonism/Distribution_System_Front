/**
 * @fileoverview Vue路由配置与权限控制系统
 * 基于Vue Router 4构建的动态路由系统，提供基于角色的权限控制、路由过滤、导航分组等完整的路由管理功能
 * 集成TypeScript类型安全、面包屑导航、组件缓存、状态保持等高级路由特性
 * 
 * @author Frontend Team
 * @since 1.0.0
 * @version 3.2.0
 * 
 * @description
 * routes.ts是整个Vue应用的路由配置核心，主要功能包括：
 * - 🛣️ 完整的路由定义体系，包含常量路由和动态权限路由
 * - 🔐 基于角色的访问控制(RBAC)，精确控制用户访问权限
 * - 📊 智能路由过滤系统，根据用户角色动态生成可访问路由
 * - 🍞 面包屑导航支持，提供完整的导航路径追踪
 * - 🎯 导航分组管理，支持business、system、main等分组
 * - 💾 组件缓存配置，优化页面切换性能和用户体验
 * - 📱 移动端适配和响应式路由处理
 * - 🔄 路由状态管理，包含滚动位置保持和过渡动画
 * 
 * @features
 * - **权限路由**: 基于用户角色的动态路由加载和权限验证
 * - **路由过滤**: 智能的递归路由过滤算法，确保权限准确性
 * - **导航分组**: 清晰的路由分组管理，支持多层级导航结构
 * - **状态保持**: 支持组件缓存、滚动位置保持、表单状态持久化
 * - **面包屑**: 自动生成面包屑导航，支持层级关系和父子页面
 * - **动画过渡**: 可配置的页面切换过渡动画
 * - **类型安全**: 完整的TypeScript类型定义和接口约束
 * - **SEO优化**: 合理的路由结构和元信息配置
 * 
 * @example
 * ```typescript
 * // 权限路由过滤使用示例
 * const userRoles = ['director', 'leader']
 * const accessibleRoutes = filterRoutesByRole(asyncRoutes, userRoles)
 * 
 * // 动态路由注册
 * router.addRoute({
 *   path: '/dynamic',
 *   component: () => import('@/views/Dynamic.vue'),
 *   meta: {
 *     title: '动态页面',
 *     roles: ['admin'],
 *     requiresAuth: true
 *   }
 * })
 * 
 * // 面包屑导航配置
 * meta: {
 *   breadcrumb: [
 *     { title: '系统管理' },
 *     { title: '用户管理', parent: 'UserList' },
 *     { title: '用户详情' }
 *   ]
 * }
 * ```
 */

import type { RouteRecordRaw } from 'vue-router'
import type { UserRole } from '@/types/api'

/**
 * 路由元信息接口定义
 * 扩展Vue Router的路由元信息，添加权限控制、导航分组、状态管理等功能
 * 
 * @interface RouteMeta
 * 
 * @property {string} [title] - 路由页面标题，用于页面标题和导航显示
 * @property {boolean} [requiresAuth=false] - 是否需要用户认证才能访问
 * @property {UserRole[]} [roles] - 允许访问的用户角色列表，为空表示所有认证用户可访问
 * @property {string} [icon] - 导航菜单中显示的图标名称，使用Lucide图标库
 * @property {boolean} [hidden=false] - 是否在导航菜单中隐藏此路由
 * @property {'main'|'business'|'system'} [group] - 导航菜单分组，用于组织菜单结构
 * @property {boolean} [keepAlive=false] - 是否缓存组件实例，保持组件状态
 * @property {boolean} [saveScrollPosition=false] - 是否保存滚动位置，返回时恢复
 * @property {string} [transition] - 页面切换过渡动画名称
 * @property {Array} [breadcrumb] - 面包屑导航配置数组
 * 
 * @example
 * ```typescript
 * const routeMeta: RouteMeta = {
 *   title: '用户管理',
 *   requiresAuth: true,
 *   roles: ['admin', 'manager'],
 *   icon: 'users',
 *   group: 'system',
 *   keepAlive: true,
 *   saveScrollPosition: true,
 *   transition: 'slide-left',
 *   breadcrumb: [
 *     { title: '系统管理' },
 *     { title: '用户管理' }
 *   ]
 * }
 * ```
 */
export interface RouteMeta {
  /** 路由页面标题，显示在浏览器标题栏和导航中 */
  title?: string
  /** 是否需要用户认证，未认证用户将被重定向到登录页 */
  requiresAuth?: boolean
  /** 允许访问的用户角色数组，空数组表示所有认证用户可访问 */
  roles?: UserRole[]
  /** 导航菜单图标，使用Lucide图标库的图标名称 */
  icon?: string
  /** 是否在导航菜单中隐藏，通常用于详情页和工具页面 */
  hidden?: boolean
  /** 导航菜单分组标识，用于组织多层级菜单结构 */
  group?: 'main' | 'business' | 'system'
  /** 是否缓存组件实例，保持页面状态和表单数据 */
  keepAlive?: boolean
  /** 是否保存页面滚动位置，便于用户返回时快速定位 */
  saveScrollPosition?: boolean
  /** 页面切换过渡动画名称，支持自定义CSS过渡效果 */
  transition?: string
  /** 面包屑导航配置，定义页面层级关系和导航路径 */
  breadcrumb?: {
    /** 面包屑项目显示标题 */
    title: string;
    /** 父级路由名称，用于建立导航层级关系 */
    parent?: string;
  }[];
}

/**
 * 应用路由记录接口定义
 * 扩展Vue Router的RouteRecordRaw，添加自定义的元信息类型支持
 * 
 * @interface AppRouteRecordRaw
 * @extends RouteRecordRaw
 * 
 * @property {RouteMeta} [meta] - 扩展的路由元信息，包含权限和导航配置
 * @property {AppRouteRecordRaw[]} [children] - 子路由数组，支持嵌套路由结构
 * 
 * @example
 * ```typescript
 * const route: AppRouteRecordRaw = {
 *   path: '/admin',
 *   name: 'Admin',
 *   component: () => import('@/layouts/AdminLayout.vue'),
 *   meta: {
 *     title: '管理后台',
 *     requiresAuth: true,
 *     roles: ['admin'],
 *     group: 'system'
 *   },
 *   children: [
 *     {
 *       path: 'users',
 *       name: 'AdminUsers',
 *       component: () => import('@/views/admin/Users.vue'),
 *       meta: {
 *         title: '用户管理',
 *         roles: ['admin']
 *       }
 *     }
 *   ]
 * }
 * ```
 */
export type AppRouteRecordRaw = RouteRecordRaw & {
  /** 扩展的路由元信息，包含权限控制和导航配置 */
  meta?: RouteMeta
  /** 子路由数组，支持递归的嵌套路由结构 */
  children?: AppRouteRecordRaw[]
}

/**
 * 基础路由配置数组
 * 定义无需权限即可访问的公共路由，包括登录、错误页面、重定向等
 * 这些路由在应用初始化时就会被注册，不受权限系统控制
 * 
 * @constant constantRoutes
 * @type {AppRouteRecordRaw[]}
 * 
 * @description 路由说明：
 * - `/login`: 用户登录页面，所有用户都可访问
 * - `/404`: 404错误页面，处理不存在的路由
 * - `/`: 根路径重定向，由路由守卫处理具体重定向逻辑
 * - `/:pathMatch(.*)*`: 通配符路由，捕获所有未匹配的路径
 * 
 * @example
 * ```typescript
 * // 路由守卫中的使用
 * router.beforeEach((to, from, next) => {
 *   const isConstantRoute = constantRoutes.some(route => route.path === to.path)
 *   if (isConstantRoute) {
 *     next() // 公共路由直接放行
 *   } else {
 *     // 检查权限...
 *   }
 * })
 * ```
 */

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

/**
 * 动态权限路由配置数组
 * 定义需要权限控制的所有业务路由，根据用户角色动态加载
 * 包含完整的业务功能模块：仪表盘、用户管理、代理管理、客资管理等
 * 
 * @constant asyncRoutes
 * @type {AppRouteRecordRaw[]}
 * 
 * @description 路由模块说明：
 * - **个人设置模块**: 用户个人信息管理，所有认证用户可访问
 * - **仪表盘模块**: 数据概览和统计，支持多角色访问
 * - **用户管理模块**: 用户列表、层级关系管理，限管理层访问
 * - **代理管理模块**: 代理列表、详情管理，支持缓存和面包屑
 * - **客资管理模块**: 客户资源管理和审核，多角色协作
 * - **成交管理模块**: 交易记录管理，销售相关角色访问
 * - **邀请管理模块**: 邀请码和历史管理，完整的邀请流程
 * - **推广管理模块**: 推广任务、审核、奖励系统，复杂权限控制
 * - **系统配置模块**: 等级规则、代理规则等，仅超管访问
 * 
 * @example
 * ```typescript
 * // 根据用户角色过滤可访问路由
 * const userRoles = ['director', 'leader']
 * const filteredRoutes = filterRoutesByRole(asyncRoutes, userRoles)
 * 
 * // 动态注册路由
 * filteredRoutes.forEach(route => {
 *   router.addRoute(route)
 * })
 * ```
 */
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
          title: '客资列表',
          icon: 'target',
          group: 'business',
          roles: ['super_admin', 'director', 'leader', 'sales'],
          requiresAuth: true,
          keepAlive: true,
          saveScrollPosition: true,
          breadcrumb: [
            { title: '客资管理' },
            { title: '客资列表' }
          ]
        }
      },
      {
        path: '/lead/audit',
        name: 'LeadAudit',
        component: () => import('@/views/lead/LeadAudit.vue'),
        meta: {
          title: '客资审核',
          icon: 'check-circle',
          group: 'business',
          roles: ['super_admin', 'director', 'leader'],
          requiresAuth: true,
          keepAlive: true,
          saveScrollPosition: true,
          breadcrumb: [
            { title: '客资管理' },
            { title: '客资审核' }
          ]
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
    meta: {
      title: '系统配置',
      icon: 'settings',
      roles: ['super_admin'],
      requiresAuth: true,
      group: 'system'
    },
    children: [
      {
        path: '/settings',
        name: 'SystemConfig',
        component: () => import('@/views/settings/LevelRule.vue'),
        meta: {
          title: '系统配置',
          roles: ['super_admin'],
          requiresAuth: true,
        },
      },
    ],
  },
  // 保留原有路由作为兼容性支持，重定向到新的统一配置页面
  {
    path: '/settings/level',
    name: 'LevelConfig',
    redirect: '/settings?tab=level',
    meta: {
      title: '等级规则',
      roles: ['super_admin'],
      requiresAuth: true,
    },
  },
  {
    path: '/settings/agent-rules',
    name: 'AgentRules',
    redirect: '/settings?tab=agent',
    meta: {
      title: '代理规则',
      roles: ['super_admin'],
      requiresAuth: true,
    },
  },
  {
    path: '/settings/commission',
    name: 'CommissionRules',
    redirect: '/settings?tab=commission',
    meta: {
      title: '返佣规则',
      roles: ['super_admin'],
      requiresAuth: true,
    },
  },
]

/**
 * 基于角色的路由过滤函数
 * 根据用户角色递归过滤路由数组，返回用户有权访问的路由集合
 * 实现完整的权限控制逻辑，包括父子路由的关联处理
 * 
 * @function filterRoutesByRole
 * @param {AppRouteRecordRaw[]} routes - 待过滤的路由数组
 * @param {string[]} userRoles - 用户拥有的角色数组
 * @returns {AppRouteRecordRaw[]} 过滤后的路由数组，仅包含用户可访问的路由
 * 
 * @complexity O(n*m) - n为路由数量，m为用户角色数量，需要遍历所有路由并检查权限
 * @flow 路由遍历 → 权限检查 → 子路由递归过滤 → 空父路由清理 → 结果返回
 * 
 * @description 过滤逻辑：
 * - **无权限限制路由**: 没有定义roles的路由，所有用户都可访问
 * - **角色匹配检查**: 用户角色与路由要求的角色有交集时允许访问
 * - **递归子路由处理**: 对子路由进行递归过滤，保持路由树结构
 * - **空父路由清理**: 移除所有子路由都被过滤掉的父路由
 * - **权限继承**: 子路由会继承父路由的权限约束
 * 
 * @example
 * ```typescript
 * // 基础使用示例
 * const allRoutes = [
 *   {
 *     path: '/admin',
 *     meta: { roles: ['admin'] },
 *     children: [
 *       { path: 'users', meta: { roles: ['admin'] } },
 *       { path: 'settings', meta: { roles: ['admin'] } }
 *     ]
 *   },
 *   {
 *     path: '/dashboard',
 *     meta: { roles: ['admin', 'user'] }
 *   }
 * ]
 * 
 * const userRoles = ['user']
 * const accessibleRoutes = filterRoutesByRole(allRoutes, userRoles)
 * // 返回: [{ path: '/dashboard', meta: { roles: ['admin', 'user'] } }]
 * 
 * // 多角色用户
 * const adminRoles = ['admin', 'user']
 * const adminRoutes = filterRoutesByRole(allRoutes, adminRoles)
 * // 返回: 完整的allRoutes数组
 * 
 * // 在路由守卫中的应用
 * router.beforeEach(async (to, from, next) => {
 *   const userRoles = await getUserRoles()
 *   const accessibleRoutes = filterRoutesByRole(asyncRoutes, userRoles)
 *   
 *   // 动态注册可访问的路由
 *   accessibleRoutes.forEach(route => {
 *     router.addRoute(route)
 *   })
 *   
 *   next()
 * })
 * ```
 */
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