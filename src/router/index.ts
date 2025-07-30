import { createRouter, createWebHistory } from 'vue-router'
import type { RouteRecordRaw } from 'vue-router'
import { useUserStore } from '@/store/user'
import { constantRoutes, asyncRoutes, filterRoutesByRole } from './routes'
import type { AppRouteRecordRaw } from './routes'
import { getUserDefaultPath } from '@/config/roleMenus'

// 创建调试函数
const debug = {
  log: (...args: any[]) => {
    if (import.meta.env.MODE !== 'production') {
      console.log('[Router Debug]', ...args)
    }
  },
  error: (...args: any[]) => {
    console.error('[Router Error]', ...args)
  },
  dumpRoutes: (routerInstance?: any) => {
    // 确保有可用的router实例
    const routerToUse = routerInstance || (typeof router !== 'undefined' ? router : null)
    if (!routerToUse) {
      console.error('[Router Error] 尝试输出路由，但router实例不可用')
      return
    }
    
    try {
      const routes = routerToUse.getRoutes()
      debug.log('当前所有路由:', routes.map((r: any) => ({
      path: r.path,
      name: r.name,
        matched: r.path === routerToUse.currentRoute?.value?.path,
      meta: r.meta
    })))
    } catch (error) {
      console.error('[Router Error] 输出路由信息失败:', error)
    }
  }
}

// 从localStorage中获取routesLoaded状态
const localRoutesLoaded = localStorage.getItem('routesLoaded') === 'true'

// 循环检测机制
let navigationCount = 0
const MAX_NAVIGATION_COUNT = 5
let lastNavigationTime = 0

// 先创建路由实例
const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL || '/'),
  routes: constantRoutes,
  scrollBehavior: () => ({ left: 0, top: 0 }),
})

// 增强版根据本地存储的角色预加载路由
function addDynamicRoutes(routerInstance = router) {
  try {
    // 检查token和用户角色
    const token = localStorage.getItem('token')
    const rolesJson = localStorage.getItem('userRoles')
    
    if (!token || !rolesJson) {
      debug.log('无token或用户角色，跳过路由预加载')
      return false
    }
    
    const roles = JSON.parse(rolesJson)
    debug.log('从本地存储预加载路由，用户角色:', roles)
    
    // 获取当前路由状态
    const hasDashboardRoute = routerInstance.hasRoute('Dashboard')
    debug.log('Dashboard路由是否存在:', hasDashboardRoute)
    
    // 过滤可访问的路由
    const accessibleRoutes = filterRoutesByRole(asyncRoutes, roles)
    debug.log('要添加的动态路由数量:', accessibleRoutes.length)
    
    // 添加动态路由
    accessibleRoutes.forEach(route => {
      // 如果路由已存在，先移除再添加
      if (route.name && routerInstance.hasRoute(route.name)) {
        debug.log('移除已存在的路由:', route.path, route.name)
        routerInstance.removeRoute(route.name)
      }

      debug.log('预加载添加路由:', route.path, route.name, route.meta?.group)
      routerInstance.addRoute(route)
    })

    // 验证路由是否正确添加
    debug.log('预加载完成后的所有路由:', routerInstance.getRoutes().map(r => ({
      path: r.path,
      name: r.name,
      group: r.meta?.group
    })))
    
    // 记录路由已加载
    localStorage.setItem('routesLoaded', 'true')

    // 输出所有已添加的路由
    debug.dumpRoutes(routerInstance)

    // 确保用户store也知道路由已加载
    try {
      // 使用动态导入，但不使用await，而是使用then
      import('@/store/user').then(({ useUserStore }) => {
        const userStore = useUserStore()
        userStore.$patch({ routesLoaded: true })
        debug.log('已更新用户store的routesLoaded状态')
      }).catch(error => {
        debug.error('更新用户store状态失败:', error)
      })
    } catch (error) {
      debug.error('导入用户store失败:', error)
    }

    return true
  } catch (error) {
    debug.error('预加载路由失败:', error)
    return false
  }
}

// 页面刷新时预加载动态路由，避免用户在具体页面刷新时被重定向
// 只有在有token和角色信息时才预加载
if (typeof window !== 'undefined') {
  const token = localStorage.getItem('token')
  const userRoles = localStorage.getItem('userRoles')

  if (token && userRoles) {
    debug.log('检测到token和角色信息，预加载动态路由')
    addDynamicRoutes(router)
  } else {
    debug.log('无token或角色信息，跳过预加载')
  }
}

// 路由守卫
router.beforeEach(async (to, from, next) => {
  // 循环检测
  const currentTime = Date.now()
  if (currentTime - lastNavigationTime < 100) {
    navigationCount++
    if (navigationCount > MAX_NAVIGATION_COUNT) {
      debug.error('检测到路由循环，强制跳转到登录页')
      navigationCount = 0
      next('/login')
      return
    }
  } else {
    navigationCount = 0
  }
  lastNavigationTime = currentTime

  debug.log(`路由导航：从 ${from.path} 到 ${to.path}`)
  debug.log('路由详细信息:', {
    toPath: to.path,
    toName: to.name,
    fromPath: from.path,
    toMeta: to.meta
  })

  const userStore = useUserStore()

  // 设置页面标题
  if (to.meta?.title) {
    document.title = `${to.meta.title} - 分销系统管理后台`
  }

  const token = userStore.token
  // 使用多重检查来判断路由是否已加载
  const dashboardExists = router.hasRoute('Dashboard')
  const leadExists = router.hasRoute('Lead')
  const localRoutesLoaded = localStorage.getItem('routesLoaded') === 'true'
  const storeRoutesLoaded = userStore.routesLoaded
  // 修复：检查关键路由是否存在，不同角色需要不同的路由
  const routesLoaded = (dashboardExists || leadExists) && (localRoutesLoaded && storeRoutesLoaded)

  debug.log('路由状态:', {
    hasToken: !!token,
    dashboardExists,
    leadExists,
    localRoutesLoaded,
    storeRoutesLoaded,
    routesLoaded,
    allRoutes: router.getRoutes().map(r => ({ path: r.path, name: r.name }))
  })

  if (token) {
    // 如果用户已登录
    if (to.path === '/login') {
      // 如果已登录且目标是登录页，根据角色重定向到对应页面
      const userRole = userStore.userInfo?.role
      let redirectPath = '/dashboard' // 默认路径

      if (userRole) {
        redirectPath = getUserDefaultPath(userRole)
        debug.log(`用户已登录，角色: ${userRole}，重定向到: ${redirectPath}`)
      } else {
        debug.log('用户已登录，但角色未知，重定向到默认路径: /dashboard')
      }

      next({ path: redirectPath })
    } else if (to.path === '/' || (to.path === '/404' && from.path === '/')) {
      // 处理根路径访问或从根路径错误重定向到404的情况
      debug.log('用户已登录，访问根路径（或从根路径重定向到404），准备重定向到 /dashboard')

      // 检查动态路由是否已加载
      if (routesLoaded) {
        // 路由已加载，直接重定向到dashboard
        debug.log('路由已加载，重定向到 /dashboard')
        next({ path: '/dashboard', replace: true })
      } else {
        try {
          // 路由未加载，先加载路由再重定向
          debug.log('路由未加载，开始获取用户信息和权限...')
          await userStore.getUserInfo()

          // 根据角色动态生成可访问的路由
          const accessibleRoutes = filterRoutesByRole(asyncRoutes, userStore.roles)
          accessibleRoutes.forEach(route => {
            // 确保不会重复添加
            if (route.name && !router.hasRoute(route.name)) {
              router.addRoute(route)
            }
          })
          debug.log('动态路由添加完毕，重定向到 /dashboard')

          // 标记路由已加载
          userStore.$patch({ routesLoaded: true })
          localStorage.setItem('routesLoaded', 'true')

          // 重定向到dashboard
          next({ path: '/dashboard', replace: true })
        } catch (error) {
          // 获取用户信息失败（例如token过期），重置状态并跳转到登录页
          debug.error('获取用户信息失败:', error)
          await userStore.$reset()
          next('/login')
        }
      }
    } else {
      // 其他路径的处理
      // 检查动态路由是否已加载
      if (routesLoaded) {
        // 路由已加载，检查是否需要智能重定向
        if (to.path === '/promotion' && userStore.userInfo?.role) {
          const userRole = userStore.userInfo.role
          if (userRole === 'agent') {
            // 代理角色重定向到提交任务页面
            debug.log('代理角色访问推广管理，重定向到提交任务页面')
            next({ path: '/promotion/submit', replace: true })
            return
          } else if (['super_admin', 'director', 'leader'].includes(userRole)) {
            // 管理员角色重定向到审核页面
            debug.log('管理员角色访问推广管理，重定向到审核页面')
            next({ path: '/promotion/audit', replace: true })
            return
          }
        }

        // 正常导航
        debug.log('路由已加载，正常导航')
        next()
      } else {
        try {
          // 路由未加载，开始获取用户信息、角色和权限
          debug.log('路由未加载，开始获取用户信息和权限...')
          await userStore.getUserInfo()

          // 根据角色动态生成可访问的路由
          const accessibleRoutes = filterRoutesByRole(asyncRoutes, userStore.roles)
          accessibleRoutes.forEach(route => {
            // 确保不会重复添加
            if (route.name && !router.hasRoute(route.name)) {
              router.addRoute(route)
            }
          })
          debug.log('动态路由添加完毕.')

          // 标记路由已加载 - 确保同时更新两个状态
          userStore.routesLoaded = true
          localStorage.setItem('routesLoaded', 'true')

          // 路由添加完成，重新导航
          debug.log('路由添加完成，重新导航到:', to.fullPath)
          next({ ...to, replace: true })
        } catch (error) {
          // 获取用户信息失败（例如token过期），重置状态并跳转到登录页
          debug.error('获取用户信息失败:', error)
          await userStore.$reset()
          next('/login')
        }
      }
    }
  } else {
    // 用户未登录
    if (to.path === '/') {
      // 未登录用户访问根路径，重定向到登录页
      debug.log('用户未登录，访问根路径，重定向到登录页')
      next('/login')
    } else if (to.meta.requiresAuth) {
      // 如果目标页面需要认证，重定向到登录页
      debug.log(`访问受限页面 ${to.path}，重定向到登录页`)
      next('/login')
    } else {
      // 不需要认证的页面，直接放行
      debug.log(`访问公共页面 ${to.path}，直接放行`)
      next()
    }
  }
})

// 后置钩子，记录导航是否完成
router.afterEach((to, from) => {
  debug.log(`路由导航完成: ${from.path} -> ${to.path}`)
})

// 路由报错钩子
router.onError((error) => {
  debug.error('路由错误:', error)
})

// 重置路由（用于登出）
export function resetRouter() {
  // 获取当前所有路由名称
  const routeNames = router.getRoutes().map(route => route.name).filter(Boolean) as string[]
  debug.log('开始重置路由，当前路由:', routeNames)
  
  // 移除所有动态添加的路由 - 特别关注Dashboard, Agent, User等关键路由
  const criticalRoutes = ['Dashboard', 'Agent', 'User', 'Lead', 'Deal', 'Promotion', 'Settings']
  
  // 先移除关键路由
  criticalRoutes.forEach(name => {
    if (router.hasRoute(name)) {
      try {
        debug.log(`移除关键路由: ${name}`)
        router.removeRoute(name)
      } catch (error) {
        debug.error(`移除关键路由失败 ${name}:`, error)
      }
    }
  })
  
  // 再移除其它动态路由
  routeNames.forEach(name => {
    const routeName = name as string
    if (routeName && routeName !== 'Login' && routeName !== '404' && !criticalRoutes.includes(routeName)) {
      try {
        debug.log(`移除动态路由: ${routeName}`)
        router.removeRoute(routeName)
      } catch (error) {
        debug.error(`移除动态路由失败 ${routeName}:`, error)
      }
    }
  })
  
  // 清除本地存储的路由状态
  localStorage.removeItem('routesLoaded')
  localStorage.removeItem('userRoles')
  
  // 再次检查，确保所有动态路由都被移除
  const remainingRoutes = router.getRoutes().map(route => route.name).filter(Boolean)
  debug.log('路由重置完成，剩余路由:', remainingRoutes)
}

export default router